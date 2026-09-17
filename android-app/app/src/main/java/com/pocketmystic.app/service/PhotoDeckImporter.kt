package com.pocketmystic.app.service

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
                name = "Arcana #${cardIndex + 1}",
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
        val deckDir = File(context.filesDir, "custom_decks/$deckId").apply { mkdirs() }
        val targetFile = File(deckDir, "card_${cardIndex}.jpg")
        context.contentResolver.openInputStream(tempUri)?.use { input ->
            targetFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }
        targetFile
    }
}
