package com.pocketmystic.app.sensor

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
}
