package com.pocketmystic.app.viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pocketmystic.app.data.JournalEntryEntity
import com.pocketmystic.app.data.MysticDatabase
import com.pocketmystic.app.engine.DeckImporter
import com.pocketmystic.app.engine.ImportedDeck
import com.pocketmystic.app.engine.ParsedCard
import com.pocketmystic.app.sensor.HapticManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File
import kotlin.random.Random

data class DrawState(
    val activeDeck: ImportedDeck? = null,
    val currentCard: ParsedCard? = null,
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
        loadDefaultDecksFromStorage()
    }

    /**
     * Loads any pre-existing decks from context.filesDir/decks/
     */
    private fun loadDefaultDecksFromStorage() {
        viewModelScope.launch {
            val decksDir = File(getApplication<Application>().filesDir, "decks")
            if (decksDir.exists() && decksDir.isDirectory) {
                val deckFolders = decksDir.listFiles { file -> file.isDirectory }
                val firstDeck = deckFolders?.firstOrNull()

                if (firstDeck != null) {
                    val images = firstDeck.listFiles { f ->
                        f.extension.lowercase() in setOf("png", "jpg", "jpeg", "webp")
                    } ?: emptyArray()

                    if (images.isNotEmpty()) {
                        val cards = images.mapIndexed { idx, file ->
                            val (index, name) = DeckImporter.parseCardMetadata(file.name, idx)
                            ParsedCard(index, name, file)
                        }.sortedBy { it.index }

                        _uiState.update {
                            it.copy(
                                activeDeck = ImportedDeck(
                                    deckId = firstDeck.name,
                                    name = firstDeck.name.replace("_", " "),
                                    cards = cards,
                                    deckDirectory = firstDeck
                                )
                            )
                        }
                    }
                }
            }
        }
    }

    /**
     * Import a new ZIP deck from Storage Access Framework URI
     */
    fun importZipDeck(uri: Uri, deckName: String) {
        viewModelScope.launch {
            DeckImporter.importDeckFromZip(getApplication(), uri, deckName)
                .onSuccess { imported ->
                    _uiState.update {
                        it.copy(
                            activeDeck = imported,
                            currentCard = null,
                            isFlipped = false,
                            errorMessage = null
                        )
                    }
                    hapticManager.performCardRevealHaptic()
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(errorMessage = error.localizedMessage ?: "Failed to import ZIP")
                    }
                }
        }
    }

    /**
     * Triggered by physical shake accelerometer or manual shuffle button
     */
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

    /**
     * Flips card with tactile reveal haptic
     */
    fun flipCard() {
        val currentFlipped = _uiState.value.isFlipped
        _uiState.update { it.copy(isFlipped = !currentFlipped) }

        if (!_uiState.value.isFlipped) {
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
                    imagePath = card.imageFile.absolutePath,
                    notes = ""
                )
            )
        }
    }
}
