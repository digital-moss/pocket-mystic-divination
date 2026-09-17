package com.pocketmystic.app.data

import java.io.File

data class AppCard(
    val index: Int,
    val name: String,
    val imageUrl: String, // Can be a file path, an asset path, or a data URL/SVG string
    val keywords: List<String> = emptyList(),
    val meaningUpright: String = "",
    val meaningReversed: String = "",
    val element: String = "",
    val symbol: String = "",
    val deckType: String = "",
    val isAsset: Boolean = false
)

data class AppDeck(
    val id: String,
    val name: String,
    val description: String,
    val cardCount: Int,
    val isCustom: Boolean,
    val cards: List<AppCard>,
    val accentColor: String = "#d4af37"
)
