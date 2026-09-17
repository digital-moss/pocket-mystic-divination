import { KotlinFile } from '../types';

export const ANDROID_KOTLIN_FILES: KotlinFile[] = [
  {
    fileName: 'DeckImporter.kt',
    packagePath: 'com.pocketmystic.app.engine',
    category: 'engine',
    description: 'SAF URI zip stream parser, disk extraction to filesDir/decks/, and regex card index normalization.',
    code: `package com.pocketmystic.app.engine

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

data class ParsedCard(
    val index: Int,
    val name: String,
    val imageFile: File
)

data class ImportedDeck(
    val deckId: String,
    val name: String,
    val cards: List<ParsedCard>,
    val deckDirectory: File
)

object DeckImporter {

    private val TAROT_NAME_MAP = mapOf(
        "fool" to 0, "magician" to 1, "highpriestess" to 2, "priestess" to 2,
        "empress" to 3, "emperor" to 4, "hierophant" to 5, "lovers" to 6,
        "lover" to 6, "chariot" to 7, "strength" to 8, "hermit" to 9,
        "wheeloffortune" to 10, "wheel" to 10, "fortune" to 10, "justice" to 11,
        "hangedman" to 12, "death" to 13, "temperance" to 14, "devil" to 15,
        "tower" to 16, "star" to 17, "moon" to 18, "sun" to 19,
        "judgement" to 20, "judgment" to 20, "world" to 21
    )

    private val IMAGE_EXTENSIONS = setOf("png", "jpg", "jpeg", "webp")

    /**
     * Unzips a custom deck archive provided by Storage Access Framework URI
     * into context.filesDir/decks/{deckName}/ and parses card metadata.
     */
    suspend fun importDeckFromZip(
        context: Context,
        zipUri: Uri,
        fallbackName: String = "Imported Deck"
    ): Result<ImportedDeck> = withContext(Dispatchers.IO) {
        runCatching {
            val contentResolver = context.contentResolver
            val inputStream: InputStream = contentResolver.openInputStream(zipUri)
                ?: throw IllegalStateException("Unable to open URI stream: $zipUri")

            // Derive directory name
            val safeDeckName = fallbackName.replace(Regex("[^a-zA-Z0-9_-]"), "_")
            val decksRoot = File(context.filesDir, "decks")
            val targetDeckDir = File(decksRoot, safeDeckName)

            if (!targetDeckDir.exists()) {
                targetDeckDir.mkdirs()
            }

            val extractedFiles = mutableListOf<File>()

            ZipInputStream(inputStream).use { zis ->
                var entry: ZipEntry? = zis.nextEntry
                val buffer = ByteArray(8192)

                while (entry != null) {
                    val entryName = entry.name
                    // Ignore MacOS metadata and directories
                    if (!entry.isDirectory &&
                        !entryName.startsWith("__MACOSX") &&
                        !entryName.startsWith(".")
                    ) {
                        val extension = entryName.substringAfterLast('.', "").lowercase(Locale.ROOT)
                        if (extension in IMAGE_EXTENSIONS) {
                            val fileName = File(entryName).name
                            val outputFile = File(targetDeckDir, fileName)

                            FileOutputStream(outputFile).use { fos ->
                                var bytesRead: Int
                                while (zis.read(buffer).also { bytesRead = it } != -1) {
                                    fos.write(buffer, 0, bytesRead)
                                }
                                fos.flush()
                            }
                            extractedFiles.add(outputFile)
                        }
                    }
                    zis.closeEntry()
                    entry = zis.nextEntry
                }
            }

            if (extractedFiles.isEmpty()) {
                throw IllegalArgumentException("No valid image files (.png, .jpg, .webp) found in ZIP archive.")
            }

            // Parse each file into ParsedCard
            val parsedCards = extractedFiles.mapIndexed { fallbackIdx, file ->
                val (index, parsedName) = parseCardMetadata(file.name, fallbackIdx)
                ParsedCard(
                    index = index,
                    name = parsedName,
                    imageFile = file
                )
            }.sortedBy { it.index }

            ImportedDeck(
                deckId = safeDeckName,
                name = fallbackName,
                cards = parsedCards,
                deckDirectory = targetDeckDir
            )
        }
    }

    /**
     * Normalizes filenames into card indices and titles:
     * Handles:
     * - "00_fool.png", "01-magician.jpg", "02 - High Priestess.webp"
     * - "0.jpg", "1.png"
     * - "The Fool.png", "death.jpg"
     */
    fun parseCardMetadata(fileName: String, fallbackIndex: Int): Pair<Int, String> {
        val nameWithoutExt = fileName.substringBeforeLast('.')

        // Pattern 1: Leading integer followed by delimiter (e.g. 00_fool, 1-magician, 05. The Hierophant)
        val prefixRegex = Regex("^(\\\\d+)[\\\\s_\\\\-\\\\.]+(.+)$")
        val prefixMatch = prefixRegex.find(nameWithoutExt)
        if (prefixMatch != null) {
            val (idxStr, rawName) = prefixMatch.destructured
            val index = idxStr.toIntOrNull() ?: fallbackIndex
            val cleanName = rawName.replace(Regex("[_\\\\-]+"), " ").trim().capitalizeWords()
            return Pair(index, cleanName)
        }

        // Pattern 2: Pure digits (e.g. 0.jpg, 1.png, 21.webp)
        val digitRegex = Regex("^(\\\\d+)$")
        val digitMatch = digitRegex.find(nameWithoutExt)
        if (digitMatch != null) {
            val index = digitMatch.groupValues[1].toIntOrNull() ?: fallbackIndex
            return Pair(index, "Card #$index")
        }

        // Pattern 3: Named tarot string without numbers (e.g. "The Fool", "wheel_of_fortune")
        val lookupKey = nameWithoutExt.lowercase(Locale.ROOT).replace(Regex("[^a-z]"), "")
        val recognizedIdx = TAROT_NAME_MAP[lookupKey]
        if (recognizedIdx != null) {
            val cleanName = nameWithoutExt.replace(Regex("[_\\\\-]+"), " ").trim().capitalizeWords()
            return Pair(recognizedIdx, cleanName)
        }

        // Fallback
        val cleanFallback = nameWithoutExt.replace(Regex("[_\\\\-]+"), " ").trim().capitalizeWords()
        return Pair(fallbackIndex, if (cleanFallback.isNotEmpty()) cleanFallback else "Card \${fallbackIndex + 1}")
    }

    private fun String.capitalizeWords(): String =
        split(" ").joinToString(" ") { word ->
            word.lowercase(Locale.ROOT).replaceFirstChar {
                if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString()
            }
        }
}`
  },
  {
    fileName: 'ShakeDetector.kt',
    packagePath: 'com.pocketmystic.app.sensor',
    category: 'sensor',
    description: 'Hardware accelerometer velocity threshold calculation and physical shake gesture detector.',
    code: `package com.pocketmystic.app.sensor

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.abs

/**
 * Detects sharp physical shake movements using TYPE_ACCELEROMETER.
 * Uses a velocity threshold calculation (~800) with a debounce guard
 * to trigger tactile deck shuffling without phantom activations.
 */
class ShakeDetector(
    private val onShake: () -> Unit
) : SensorEventListener {

    companion object {
        private const val SHAKE_THRESHOLD_VELOCITY = 800
        private const val UPDATE_INTERVAL_MS = 100L
        private const val SHAKE_COOLDOWN_MS = 800L
    }

    private var lastUpdate: Long = 0L
    private var lastShakeTime: Long = 0L
    private var lastX: Float = 0f
    private var lastY: Float = 0f
    private var lastZ: Float = 0f

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        val currentTime = System.currentTimeMillis()
        val diffTime = currentTime - lastUpdate

        if (diffTime > UPDATE_INTERVAL_MS) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]

            // Calculate instantaneous movement velocity
            val deltaX = abs(x - lastX)
            val deltaY = abs(y - lastY)
            val deltaZ = abs(z - lastZ)

            val speed = ((deltaX + deltaY + deltaZ) / diffTime.toFloat()) * 10000

            if (speed > SHAKE_THRESHOLD_VELOCITY) {
                if (currentTime - lastShakeTime > SHAKE_COOLDOWN_MS) {
                    lastShakeTime = currentTime
                    onShake()
                }
            }

            lastX = x
            lastY = y
            lastZ = z
            lastUpdate = currentTime
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op
    }

    fun register(sensorManager: SensorManager): Boolean {
        val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        return if (accelerometer != null) {
            sensorManager.registerListener(
                this,
                accelerometer,
                SensorManager.SENSOR_DELAY_UI
            )
            true
        } else {
            false
        }
    }

    fun unregister(sensorManager: SensorManager) {
        sensorManager.unregisterListener(this)
    }
}`
  },
  {
    fileName: 'HapticManager.kt',
    packagePath: 'com.pocketmystic.app.sensor',
    category: 'sensor',
    description: 'Tactile haptic engine using Android Vibrator & VibrationEffect API for e-ink hardware sensation.',
    code: `package com.pocketmystic.app.sensor

import android.content.Context
import android.os.Build
import android.os.CombinedVibration
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class HapticManager(context: Context) {

    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vibratorManager?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    /**
     * Soft tactile click when flipping card or completing shake gesture
     */
    fun performClickFeedback() {
        vibrator?.let { v ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                v.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(20L)
            }
        }
    }

    /**
     * Crisp double tick on full card reveal
     */
    fun performCardRevealHaptic() {
        vibrator?.let { v ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                v.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(longArrayOf(0, 15, 50, 25), -1)
            }
        }
    }

    /**
     * Riffle tick during active accelerometer shaking
     */
    fun performShuffleTick() {
        vibrator?.let { v ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                v.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(8L)
            }
        }
    }
}`
  },
  {
    fileName: 'MysticViewModel.kt',
    packagePath: 'com.pocketmystic.app.viewmodel',
    category: 'viewmodel',
    description: 'StateFlow<DrawState> manager, active deck loading from internal file storage, and random draw selection.',
    code: `package com.pocketmystic.app.viewmodel

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
}`
  },
  {
    fileName: 'ShakeToDrawScreen.kt',
    packagePath: 'com.pocketmystic.app.ui',
    category: 'ui',
    description: 'Jetpack Compose screen with #121212 e-ink dark mode, 3D graphicsLayer card flip, and Coil image rendering.',
    code: `package com.pocketmystic.app.ui

import android.content.Context
import android.hardware.SensorManager
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pocketmystic.app.sensor.ShakeDetector
import com.pocketmystic.app.viewmodel.MysticViewModel

val DarkEInkBackground = Color(0xFF121212)
val EInkBorderColor = Color(0xFF282828)
val EInkTextWhite = Color(0xFFE5E5E5)
val EInkTextMuted = Color(0xFF888888)

@Composable
fun ShakeToDrawScreen(
    viewModel: MysticViewModel,
    onOpenDeckManager: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Register physical accelerometer sensor listener with Compose lifecycle
    DisposableEffect(Unit) {
        val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val shakeDetector = ShakeDetector {
            viewModel.onShakeTriggered()
        }
        shakeDetector.register(sensorManager)

        onDispose {
            shakeDetector.unregister(sensorManager)
        }
    }

    val rotationY by animateFloatAsState(
        targetValue = if (uiState.isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing),
        label = "CardFlipAnimation"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkEInkBackground)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Minimal Status Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "POCKET MYSTIC",
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = EInkTextWhite,
                letterSpacing = 2.sp
            )

            TextButton(onClick = onOpenDeckManager) {
                Text(
                    text = "[ \${uiState.activeDeck?.name ?: "NO DECK"} ]",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = EInkTextMuted
                )
            }
        }

        // Center 3D Flipping Card
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            val currentCard = uiState.currentCard

            Box(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .aspectRatio(0.62f)
                    .graphicsLayer {
                        this.rotationY = rotationY
                        cameraDistance = 14f * density
                        if (uiState.isReversed && rotationY >= 90f) {
                            rotationZ = 180f
                        }
                    }
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, EInkBorderColor, RoundedCornerShape(12.dp))
                    .clickable { viewModel.flipCard() }
            ) {
                if (rotationY < 90f) {
                    // Card Back (E-ink geometric pattern)
                    CardBack()
                } else {
                    // Card Front Face with Coil image
                    if (currentCard != null) {
                        AsyncImage(
                            model = currentCard.imageFile,
                            contentDescription = currentCard.name,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
                                    // Mirror front face back so image is not inverted
                                    this.rotationY = 180f
                                },
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        CardBack()
                    }
                }
            }
        }

        // Bottom Controls & Prompt
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            if (uiState.currentCard != null && uiState.isFlipped) {
                Text(
                    text = uiState.currentCard!!.name.uppercase(),
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = EInkTextWhite,
                    letterSpacing = 1.5.sp
                )
                if (uiState.isReversed) {
                    Text(
                        text = "REVERSED",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        color = EInkTextMuted,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            } else {
                Text(
                    text = "SHAKE PHONE TO DRAW",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 13.sp,
                    color = EInkTextMuted,
                    letterSpacing = 2.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { viewModel.onShakeTriggered() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1E1E1E),
                    contentColor = EInkTextWhite
                ),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .border(1.dp, EInkBorderColor, RoundedCornerShape(4.dp))
            ) {
                Text(
                    text = "SHUFFLE DECK",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

@Composable
fun CardBack() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF181818))
            .border(2.dp, Color(0xFF2A2A2A), RoundedCornerShape(12.dp))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "✦",
                fontSize = 32.sp,
                color = Color(0xFF555555)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "POCKET MYSTIC",
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                letterSpacing = 3.sp,
                color = Color(0xFF666666)
            )
        }
    }
}`
  },
  {
    fileName: 'JournalEntities.kt',
    packagePath: 'com.pocketmystic.app.data',
    category: 'storage',
    description: 'Room Database entity, DAO, and singleton database instance for persistent offline journal logs.',
    code: `package com.pocketmystic.app.data

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "draw_journal")
data class JournalEntryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val cardIndex: Int,
    val cardName: String,
    val deckName: String,
    val isReversed: Boolean,
    val timestamp: Long,
    val imagePath: String,
    val notes: String
)

@Entity(tableName = "card_associations", primaryKeys = ["deckId", "cardIndex", "word"])
data class CardAssociationEntity(
    val deckId: String,
    val cardIndex: Int,
    val cardName: String,
    val word: String,
    val isCustom: Boolean = true
)

@Dao
interface JournalDao {
    @Query("SELECT * FROM draw_journal ORDER BY timestamp DESC")
    fun getAllDraws(): Flow<List<JournalEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDraw(entry: JournalEntryEntity): Long

    @Query("UPDATE draw_journal SET notes = :notes WHERE id = :id")
    suspend fun updateNotes(id: Long, notes: String)

    @Delete
    suspend fun deleteDraw(entry: JournalEntryEntity)

    @Query("DELETE FROM draw_journal")
    suspend fun clearAll()

    // Word Associations queries
    @Query("SELECT word FROM card_associations WHERE deckId = :deckId AND cardIndex = :cardIndex")
    fun getCardAssociations(deckId: String, cardIndex: Int): Flow<List<String>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addAssociation(association: CardAssociationEntity)

    @Query("DELETE FROM card_associations WHERE deckId = :deckId AND cardIndex = :cardIndex AND word = :word")
    suspend fun removeAssociation(deckId: String, cardIndex: Int, word: String)
}

@Database(entities = [JournalEntryEntity::class, CardAssociationEntity::class], version = 2, exportSchema = false)
abstract class MysticDatabase : RoomDatabase() {
    abstract fun journalDao(): JournalDao

    companion object {
        @Volatile
        private var INSTANCE: MysticDatabase? = null

        fun getInstance(context: Context): MysticDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MysticDatabase::class.java,
                    "pocket_mystic.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    fileName: 'MainActivity.kt',
    packagePath: 'com.pocketmystic.app',
    category: 'ui',
    description: 'Android entry Activity with Storage Access Framework GetContent() file picker contract.',
    code: `package com.pocketmystic.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.pocketmystic.app.ui.DarkEInkBackground
import com.pocketmystic.app.ui.ShakeToDrawScreen
import com.pocketmystic.app.viewmodel.MysticViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MysticViewModel by viewModels()

    // Android Storage Access Framework contract for importing .zip deck archives
    private val zipFilePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            viewModel.importZipDeck(it, "Custom Zip Deck")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = DarkEInkBackground
            ) {
                ShakeToDrawScreen(
                    viewModel = viewModel,
                    onOpenDeckManager = {
                        // Launch SAF file picker to select .zip
                        zipFilePickerLauncher.launch("application/zip")
                    }
                )
            }
        }
    }
}`
  },
  {
    fileName: 'build.gradle.kts',
    packagePath: 'app',
    category: 'config',
    description: 'App-level Gradle script with Jetpack Compose, Coil image loading, Room database, and Sensor dependencies.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
}

android {
    namespace = "com.pocketmystic.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pocketmystic.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Image Loading (Coil)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // CameraX for physical card photo captures
    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")
}`
  },
  {
    fileName: 'PhotoDeckImporter.kt',
    packagePath: 'com.pocketmystic.app.service',
    category: 'storage',
    description: 'Android CameraX and TakePicture contract helper that captures card photos and auto-populates card names, word associations, and meanings.',
    code: `package com.pocketmystic.app.service

import android.content.Context
import android.net.Uri
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

data class PopulatedCardMetadata(
    val name: String,
    val keywords: List<String>,
    val meaningUpright: String,
    val meaningReversed: String,
    val element: String
)

class PhotoDeckImporter(private val context: Context) {

    /**
     * Auto-populates archetypal card data based on card sequence index
     */
    fun populateCardData(cardIndex: Int, theme: String = "tarot"): PopulatedCardMetadata {
        val archetypes = listOf(
            Triple("The Fool", listOf("New Beginnings", "Innocence", "Clean Slate", "Spontaneity"), "Air"),
            Triple("The Magician", listOf("Manifestation", "Willpower", "Focus", "Alchemy"), "Air / Mercury"),
            Triple("The High Priestess", listOf("Intuition", "Subconscious", "Mystery", "Silence"), "Water / Moon"),
            Triple("The Empress", listOf("Abundance", "Nature", "Fertility", "Creativity"), "Earth / Venus"),
            Triple("The Emperor", listOf("Authority", "Structure", "Discipline", "Leadership"), "Fire / Aries")
        )

        return if (cardIndex < archetypes.size) {
            val (name, keywords, element) = archetypes[cardIndex]
            PopulatedCardMetadata(
                name = name,
                keywords = keywords,
                meaningUpright = "Step forward with confidence and embrace the wisdom of $name.",
                meaningReversed = "Reflect on imbalances and realign before taking decisive action.",
                element = element
            )
        } else {
            PopulatedCardMetadata(
                name = "Arcana #\${cardIndex + 1}",
                keywords = listOf("Intuition", "Guidance", "Clarity", "Presence"),
                meaningUpright = "Look within to reveal the clear answer hidden in plain sight.",
                meaningReversed = "Pause distractions and trust the subtle signs around you.",
                element = "Ether"
            )
        }
    }

    /**
     * Saves captured card photo to internal app storage for offline deck rendering
     */
    suspend fun saveCardPhoto(deckId: String, cardIndex: Int, tempUri: Uri): File = withContext(Dispatchers.IO) {
        val deckDir = File(context.filesDir, "custom_decks/\$deckId").apply { mkdirs() }
        val targetFile = File(deckDir, "card_\${cardIndex}.jpg")
        context.contentResolver.openInputStream(tempUri)?.use { input ->
            targetFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }
        targetFile
    }
}`
  }
];
