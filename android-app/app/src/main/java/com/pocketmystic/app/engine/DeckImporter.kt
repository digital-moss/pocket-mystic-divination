package com.pocketmystic.app.engine

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
        val prefixRegex = Regex("^(\\d+)[\\s_\\-\\.]+(.+)$")
        val prefixMatch = prefixRegex.find(nameWithoutExt)
        if (prefixMatch != null) {
            val (idxStr, rawName) = prefixMatch.destructured
            val index = idxStr.toIntOrNull() ?: fallbackIndex
            val cleanName = rawName.replace(Regex("[_\\-]+"), " ").trim().capitalizeWords()
            return Pair(index, cleanName)
        }

        // Pattern 2: Pure digits (e.g. 0.jpg, 1.png, 21.webp)
        val digitRegex = Regex("^(\\d+)$")
        val digitMatch = digitRegex.find(nameWithoutExt)
        if (digitMatch != null) {
            val index = digitMatch.groupValues[1].toIntOrNull() ?: fallbackIndex
            return Pair(index, "Card #$index")
        }

        // Pattern 3: Named tarot string without numbers (e.g. "The Fool", "wheel_of_fortune")
        val lookupKey = nameWithoutExt.lowercase(Locale.ROOT).replace(Regex("[^a-z]"), "")
        val recognizedIdx = TAROT_NAME_MAP[lookupKey]
        if (recognizedIdx != null) {
            val cleanName = nameWithoutExt.replace(Regex("[_\\-]+"), " ").trim().capitalizeWords()
            return Pair(recognizedIdx, cleanName)
        }

        // Fallback
        val cleanFallback = nameWithoutExt.replace(Regex("[_\\-]+"), " ").trim().capitalizeWords()
        return Pair(fallbackIndex, if (cleanFallback.isNotEmpty()) cleanFallback else "Card ${fallbackIndex + 1}")
    }

    private fun String.capitalizeWords(): String =
        split(" ").joinToString(" ") { word ->
            word.lowercase(Locale.ROOT).replaceFirstChar {
                if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString()
            }
        }
}
