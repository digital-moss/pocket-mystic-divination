package com.pocketmystic.app

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
}
