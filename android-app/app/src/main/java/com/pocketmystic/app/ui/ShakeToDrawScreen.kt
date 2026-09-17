package com.pocketmystic.app.ui

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import coil.decode.SvgDecoder
import com.pocketmystic.app.sensor.ShakeDetector
import com.pocketmystic.app.viewmodel.MysticViewModel
import com.pocketmystic.app.data.AppCard

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
                    text = "[ ${uiState.activeDeck?.name ?: "NO DECK"} ]",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = EInkTextMuted
                )
            }
        }

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
                    CardBack()
                } else {
                    if (currentCard != null) {
                        // Data handling for SVGs vs Files
                        val model = if (currentCard.imageUrl.startsWith("<svg")) {
                            currentCard.imageUrl.toByteArray()
                        } else {
                            currentCard.imageUrl
                        }

                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(model)
                                .decoderFactory(SvgDecoder.Factory())
                                .build(),
                            contentDescription = currentCard.name,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
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
}
