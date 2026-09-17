package com.pocketmystic.app.viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pocketmystic.app.data.*
import com.pocketmystic.app.engine.DeckImporter
import com.pocketmystic.app.sensor.HapticManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File
import kotlin.random.Random

data class DrawState(
    val decks: List<AppDeck> = DefaultDecks.INITIAL_DECKS,
    val activeDeck: AppDeck? = DefaultDecks.INITIAL_DECKS.firstOrNull(),
    val currentCard: AppCard? = null,
    val isFlipped: Boolean = false,
    val isReversed: Boolean = false,
    val isShuffling: Boolean = false,
    val drawTimestamp: Long? = null,
    val totalDraws: Int = 0,
    val errorMessage: String? = null
)

class MysticViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(DrawState())
    val uiState: StateFlow<DrawState> = _uiState.asStateFlow()

    private val hapticManager = HapticManager(application.applicationContext)
    private val journalDao = MysticDatabase.getInstance(application.applicationContext).journalDao()

    init {
        loadImportedDecks()
    }

    private fun loadImportedDecks() {
        viewModelScope.launch {
            val decksDir = File(getApplication<Application>().filesDir, "decks")
            if (decksDir.exists() && decksDir.isDirectory) {
                val deckFolders = decksDir.listFiles { file -> file.isDirectory } ?: emptyArray()
                val importedDecks = deckFolders.mapNotNull { folder ->
                    val images = folder.listFiles { f ->
                        f.extension.lowercase() in setOf("png", "jpg", "jpeg", "webp")
                    } ?: emptyArray()

                    if (images.isNotEmpty()) {
                        val cards = images.mapIndexed { idx, file ->
                            val (index, name) = DeckImporter.parseCardMetadata(file.name, idx)
                            AppCard(index, name, file.absolutePath)
                        }.sortedBy { it.index }

                        AppDeck(
                            id = folder.name,
                            name = folder.name.replace("_", " "),
                            description = "Imported custom deck",
                            cardCount = cards.size,
                            isCustom = true,
                            cards = cards
                        )
                    } else null
                }
                
                _uiState.update { state ->
                    val allDecks = DefaultDecks.INITIAL_DECKS + importedDecks
                    state.copy(
                        decks = allDecks,
                        activeDeck = state.activeDeck ?: allDecks.firstOrNull()
                    )
                }
            }
        }
    }

    fun selectDeck(deck: AppDeck) {
        _uiState.update { it.copy(activeDeck = deck, currentCard = null, isFlipped = false) }
    }

    fun importZipDeck(uri: Uri, deckName: String) {
        viewModelScope.launch {
            DeckImporter.importDeckFromZip(getApplication(), uri, deckName)
                .onSuccess { imported ->
                    _uiState.update { state ->
                        val newDecks = state.decks + imported
                        state.copy(
                            decks = newDecks,
                            activeDeck = imported,
                            currentCard = null,
                            isFlipped = false,
                            errorMessage = null
                        )
                    }
                    hapticManager.performCardRevealHaptic()
                }
                .onFailure { error ->
                    _uiState.update { it.copy(errorMessage = error.localizedMessage ?: "Failed to import ZIP") }
                }
        }
    }

    fun onShakeTriggered() {
        val deck = _uiState.value.activeDeck ?: return
        if (deck.cards.isEmpty()) return

        hapticManager.performShuffleTick()
        _uiState.update { it.copy(isShuffling = true) }

        // Pick random card and reversal orientation
        val randomCard = deck.cards[Random.nextInt(deck.cards.size)]
        val isReversed = Random.nextBoolean()

        _uiState.update {
            it.copy(
                currentCard = randomCard,
                isFlipped = false,
                isReversed = isReversed,
                isShuffling = false,
                drawTimestamp = System.currentTimeMillis(),
                totalDraws = it.totalDraws + 1
            )
        }
    }

    fun flipCard() {
        val currentFlipped = _uiState.value.isFlipped
        _uiState.update { it.copy(isFlipped = !currentFlipped) }

        if (_uiState.value.isFlipped) {
            hapticManager.performCardRevealHaptic()
            logCurrentDrawToJournal()
        } else {
            hapticManager.performClickFeedback()
        }
    }

    private fun logCurrentDrawToJournal() {
        val state = _uiState.value
        val card = state.currentCard ?: return
        val deck = state.activeDeck ?: return

        viewModelScope.launch {
            journalDao.insertDraw(
                JournalEntryEntity(
                    cardIndex = card.index,
                    cardName = card.name,
                    deckName = deck.name,
                    isReversed = state.isReversed,
                    timestamp = state.drawTimestamp ?: System.currentTimeMillis(),
                    imagePath = card.imageUrl,
                    notes = ""
                )
            )
        }
    }
}
