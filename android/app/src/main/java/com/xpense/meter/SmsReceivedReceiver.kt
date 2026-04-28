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
                
                // In a production app, you would parse the amount here
                // and save it to a local database that the Webview can access
                // or send it to your server.
            }
        }
    }
}
