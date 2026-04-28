package com.xpense.meter

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

class SmsReceivedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                val body = sms.messageBody
                val sender = sms.originatingAddress
                Log.d("SmsReceivedReceiver", "SMS from $sender: $body")
                
                // --- PRODUCTION BRIDGE LOGIC ---
                // 1. Persistence: Save raw msg to local ROOM database
                // 2. Event Push: Use a broadcast or bridge (e.g. Capacitor) to notify the React UI
                // 3. Security: Scrub OTPs before storing
                // ---------------------------------
            }
        }
    }
}
