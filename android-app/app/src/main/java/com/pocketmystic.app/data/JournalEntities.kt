package com.pocketmystic.app.data

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
}
