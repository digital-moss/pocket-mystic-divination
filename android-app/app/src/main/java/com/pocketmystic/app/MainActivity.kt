package com.pocketmystic.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.pocketmystic.app.ui.DarkEInkBackground
import com.pocketmystic.app.ui.ShakeToDrawScreen
import com.pocketmystic.app.viewmodel.MysticViewModel
// Removed unused import


class MainActivity : ComponentActivity() {

    private val viewModel: MysticViewModel by viewModels()

    private val zipFilePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent(),

    ) { uri ->
        uri?.let {
            viewModel.importZipDeck(it, "Custom Zip Deck")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val navController = rememberNavController()
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentRoute = navBackStackEntry?.destination?.route
            
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = DarkEInkBackground,
            ) {
                Scaffold(
                    bottomBar = {
                        NavigationBar(
                            containerColor = DarkEInkBackground,
                            contentColor = MaterialTheme.colorScheme.onSurface,
                        ) {
                            NavigationBarItem(
                                icon = { Icon(Icons.Default.Refresh, contentDescription = "Draw") },
                                label = { Text("Draw") },
                                selected = currentRoute == "draw",
                                onClick = { navController.navigate("draw") },

                            )
                            NavigationBarItem(
                                icon = { Icon(Icons.AutoMirrored.Filled.List, contentDescription = "Decks") },

                                label = { Text("Decks") },
                                selected = currentRoute == "decks",
                                onClick = { navController.navigate("decks") }
                            )
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "draw",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("draw") {
                            ShakeToDrawScreen(
                                viewModel = viewModel,
                                onOpenDeckManager = {
                                    navController.navigate("decks")
                                }
                            )
                        }
                        composable("decks") {
                            DeckManagerScreen(
                                viewModel = viewModel
                            ) {
                                zipFilePickerLauncher.launch("application/zip")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DeckManagerScreen(
    viewModel: MysticViewModel,
    onImportDeck: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            "Deck Manager",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(onClick = onImportDeck) {
            Text("Import ZIP Deck")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        uiState.decks.forEach { deck ->
            ListItem(
                headlineContent = { Text(deck.name) },
                supportingContent = { Text(deck.description) },
                trailingContent = {
                    if (uiState.activeDeck?.id == deck.id) {
                        Text("Active", color = MaterialTheme.colorScheme.primary)
                    } else {
                        Button(onClick = { viewModel.selectDeck(deck) }) {
                            Text("Select")
                        }
                    }
                }
            )
        }
    }
}
