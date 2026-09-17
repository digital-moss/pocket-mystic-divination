package com.pocketmystic.app.data

object DefaultDecks {

    private val riderWaiteUrls = listOf(
        "https://upload.wikimedia.org/wikipedia/commons/9/90/Rider-Waite-Tarot-00-Fool.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/de/Rider-Waite-Tarot-01-Magician.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/8/88/Rider-Waite-Tarot-02-HighPriestess.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/d2/Rider-Waite-Tarot-03-Empress.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/c/c3/Rider-Waite-Tarot-04-Emperor.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/8/8d/Rider-Waite-Tarot-05-Hierophant.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/db/Rider-Waite-Tarot-06-Lovers.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/9/9b/Rider-Waite-Tarot-07-Chariot.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/f/f5/Rider-Waite-Tarot-08-Strength.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/4/4d/Rider-Waite-Tarot-09-Hermit.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/3/3c/Rider-Waite-Tarot-10-WheelOfFortune.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/e0/Rider-Waite-Tarot-11-Justice.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/2b/Rider-Waite-Tarot-12-HangedMan.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/d7/Rider-Waite-Tarot-13-Death.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/f/f8/Rider-Waite-Tarot-14-Temperance.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/5/55/Rider-Waite-Tarot-15-Devil.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/5/53/Rider-Waite-Tarot-16-Tower.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/db/Rider-Waite-Tarot-17-Star.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/7/7f/Rider-Waite-Tarot-18-Moon.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/17/Rider-Waite-Tarot-19-Sun.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/dd/Rider-Waite-Tarot-20-Judgement.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/f/ff/Rider-Waite-Tarot-21-World.jpg"
    )

    private fun createTarotCardSvg(
        numberStr: String,
        title: String,
        primarySymbol: String,
        accentColor: String = "#c5a059"
    ): String {
        return """
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
          <rect width="320" height="520" rx="14" fill="#121212" />
          <rect x="10" y="10" width="300" height="500" rx="10" fill="none" stroke="$accentColor" stroke-width="1.2" opacity="0.5" />
          <text x="160" y="52" fill="$accentColor" font-family="serif" font-size="16" font-weight="700" text-anchor="middle">$numberStr</text>
          <text x="160" y="258" font-family="serif" font-size="78" text-anchor="middle" fill="$accentColor">$primarySymbol</text>
          <text x="160" y="458" fill="#f4ede0" font-family="serif" font-size="15" font-weight="600" text-anchor="middle">${title.uppercase()}</text>
        </svg>
        """.trimIndent()
    }

    val TAROT_MAJOR_ARCANA = listOf(
        AppCard(0, "The Fool", createTarotCardSvg("0", "The Fool", "☼", "#e6a147"), listOf("Beginnings", "Innocence"), "A fresh new journey.", "Recklessness.", "Air", "☼", "tarot", true),
        AppCard(1, "The Magician", createTarotCardSvg("I", "The Magician", "∞", "#d4af37"), listOf("Manifestation", "Power"), "Tools ready.", "Manipulation.", "Air", "∞", "tarot", true),
        AppCard(2, "The High Priestess", createTarotCardSvg("II", "The High Priestess", "☽", "#9ca3af"), listOf("Intuition", "Mystery"), "Trust inner voice.", "Ignoring gut.", "Water", "☽", "tarot", true),
        AppCard(3, "The Empress", createTarotCardSvg("III", "The Empress", "♀", "#78b584"), listOf("Abundance", "Nurturing"), "Growth.", "Blockages.", "Earth", "♀", "tarot", true),
        AppCard(4, "The Emperor", createTarotCardSvg("IV", "The Emperor", "♈", "#c95147"), listOf("Authority", "Stability"), "Order.", "Tyranny.", "Fire", "♈", "tarot", true),
        AppCard(5, "The Hierophant", createTarotCardSvg("V", "The Hierophant", "☩", "#d4a373"), listOf("Wisdom", "Tradition"), "Establish traditions.", "Challenging dogmas.", "Earth", "☩", "tarot", true),
        AppCard(6, "The Lovers", createTarotCardSvg("VI", "The Lovers", "♡", "#e879a9"), listOf("Love", "Harmony"), "Soul connection.", "Misalignment.", "Air", "♡", "tarot", true),
        AppCard(7, "The Chariot", createTarotCardSvg("VII", "The Chariot", "⚔", "#60a5fa"), listOf("Determination", "Willpower"), "Harness drives.", "Loss of control.", "Water", "⚔", "tarot", true),
        AppCard(8, "Strength", createTarotCardSvg("VIII", "Strength", "♌", "#f59e0b"), listOf("Courage", "Compassion"), "True power is soft.", "Self-doubt.", "Fire", "♌", "tarot", true),
        AppCard(9, "The Hermit", createTarotCardSvg("IX", "The Hermit", "🏮", "#94a3b8"), listOf("Searching", "Solitude"), "Withdraw for reflection.", "Isolation.", "Earth", "🏮", "tarot", true),
        AppCard(10, "Wheel of Fortune", createTarotCardSvg("X", "Wheel of Fortune", "☸", "#10b981"), listOf("Cycles", "Karma"), "Inevitable cycles.", "Resisting change.", "Fire", "☸", "tarot", true),
        AppCard(11, "Justice", createTarotCardSvg("XI", "Justice", "⚖", "#38bdf8"), listOf("Fairness", "Truth"), "Radical honesty.", "Dishonesty.", "Air", "⚖", "tarot", true),
        AppCard(12, "The Hanged Man", createTarotCardSvg("XII", "The Hanged Man", "⚓", "#818cf8"), listOf("Surrender", "Perspective"), "Willful sacrifice.", "Stalling.", "Water", "⚓", "tarot", true),
        AppCard(13, "Death", createTarotCardSvg("XIII", "Death", "☠", "#a855f7"), listOf("Transformation", "Renewal"), "Endings for rebirth.", "Fear of change.", "Water", "☠", "tarot", true),
        AppCard(14, "Temperance", createTarotCardSvg("XIV", "Temperance", "⚗", "#34d399"), listOf("Balance", "Purpose"), "Blending opposites.", "Imbalance.", "Fire", "⚗", "tarot", true),
        AppCard(15, "The Devil", createTarotCardSvg("XV", "The Devil", "⛧", "#ef4444"), listOf("Shadow", "Bondage"), "Face unhealthy habits.", "Breaking free.", "Earth", "⛧", "tarot", true),
        AppCard(16, "The Tower", createTarotCardSvg("XVI", "The Tower", "⚡", "#f97316"), listOf("Upheaval", "Revelation"), "Sudden awakening.", "Fear of collapse.", "Fire", "⚡", "tarot", true),
        AppCard(17, "The Star", createTarotCardSvg("XVII", "The Star", "★", "#38bdf8"), listOf("Hope", "Faith"), "Clear skies.", "Hopelessness.", "Air", "★", "tarot", true),
        AppCard(18, "The Moon", createTarotCardSvg("XVIII", "The Moon", "☽", "#93c5fd"), listOf("Illusion", "Dreams"), "Tune intuition.", "Unveiling deception.", "Water", "☽", "tarot", true),
        AppCard(19, "The Sun", createTarotCardSvg("XIX", "The Sun", "☼", "#eab308"), listOf("Joy", "Success"), "Unbridled light.", "Clouded optimism.", "Fire", "☼", "tarot", true),
        AppCard(20, "Judgement", createTarotCardSvg("XX", "Judgement", "🕪", "#a78bfa"), listOf("Rebirth", "Awakening"), "Step into alignment.", "Self-criticism.", "Fire", "🕪", "tarot", true),
        AppCard(21, "The World", createTarotCardSvg("XXI", "The World", "🜛", "#2dd4bf"), listOf("Completion", "Integration"), "Mastery achieved.", "Lack of closure.", "Earth", "🜛", "tarot", true)
    )

    val RIDER_WAITE_CARDS = TAROT_MAJOR_ARCANA.mapIndexed { idx, card ->
        val filename = String.format("m%02d.jpg", idx)
        card.copy(imageUrl = "file:///android_asset/tarot/$filename")
    }

    val INITIAL_DECKS = listOf(
        AppDeck(
            id = "tarot-major-arcana",
            name = "Tarot (Major Arcana)",
            description = "The 22 primary archetypes of spiritual evolution.",
            cardCount = TAROT_MAJOR_ARCANA.size,
            isCustom = false,
            cards = TAROT_MAJOR_ARCANA,
            accentColor = "#e6a147"
        ),
        AppDeck(
            id = "rider-waite-tarot",
            name = "Rider-Waite Tarot",
            description = "The iconic Rider-Waite-Smith 78-card deck featuring authentic Pamela Colman Smith historical artwork and rich traditional symbolism.",
            cardCount = RIDER_WAITE_CARDS.size,
            isCustom = false,
            cards = RIDER_WAITE_CARDS,
            accentColor = "#d4af37"
        )
    )
}
