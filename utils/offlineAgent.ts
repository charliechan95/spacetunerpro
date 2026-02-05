
export class OfflineAgent {
  static chat(input: string, context?: { note: string; cents: number }): string {
    const query = input.toLowerCase();
    
    // 1. Check for greeting
    if (query.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
      const greetings = [
        "Hello! I'm Aura, your tuning specialist. How can I help you today?",
        "Hi there! I'm here to help with your handpan or tongue drum. What would you like to know?",
        "Greetings! I can assist with tuning advice, maintenance tips, or general questions about your instrument."
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 2. Check for thanks/gratitude
    if (query.includes('thank') || query.includes('thanks') || query.includes('appreciate')) {
      const thanks = [
        "You're welcome! Happy to help with your tuning journey.",
        "My pleasure! Enjoy making music.",
        "You're very welcome. Don't hesitate to ask if you have more questions!"
      ];
      return thanks[Math.floor(Math.random() * thanks.length)];
    }

    // 3. Contextual Tuning Advice (Active Tuning)
    if (context && (query.includes('tune') || query.includes('fix') || query.includes('adjust') || query.includes('help') || query.includes('what') || query.includes('do') || query.includes('check'))) {
      const { note, cents } = context;
      const absCents = Math.abs(cents);
      
      if (absCents <= 5) {
        return `Your note ${note} is currently in tune (${cents.toFixed(1)} cents). Excellent work! The note is stable and ready to play.`;
      }
      
      const isSharp = cents > 0;
      const direction = isSharp ? "lower" : "raise";
      const state = isSharp ? "sharp (frequency too high)" : "flat (frequency too low)";
      const action = isSharp ? "expand the metal" : "compress the metal";
      
      let advice = `The note ${note} is ${state} by ${absCents.toFixed(1)} cents.\n\n`;
      advice += `To ${direction} the pitch:\n\n`;
      advice += `FOR HANDPANS:\n`;
      advice += `• ${isSharp ? "Hammer the outer ring (boundary) of the tone field" : "Hammer the center dimple gently"} to ${action}\n`;
      advice += `• Use light taps - many light strokes work better than heavy blows\n\n`;
      advice += `FOR TONGUE DRUMS:\n`;
      advice += `• ${isSharp ? "Add weight: Use magnets, beeswax, or tape on the tongue tip" : "Remove weight: File carefully underneath the tongue tip"}`;
      
      return advice;
    }

    // 4. Beginner / Getting Started Questions
    if ((query.includes('how') && query.includes('start')) || query.includes('getting started') || query.includes('beginner')) {
      return `Welcome to SpaceTuner Pro! Here's how to get started:\n\n` +
             `1. SELECT YOUR SCALE: Tap the scale name in the header to choose your instrument's scale (like Kurd, Hijaz, Celtic)\n\n` +
             `2. STRIKE YOUR INSTRUMENT: Play a note clearly and watch the tuner\n\n` +
             `3. READ THE METER:\n` +
             `   • Green zone = In tune (within 5 cents)\n` +
             `   • Yellow zone = Close (5-20 cents off)\n` +
             `   • Red zone = Far (more than 20 cents off)\n\n` +
             `4. ADJUST: If the meter shows sharp (+) or flat (-), gently hammer to adjust\n\n` +
             `The AI Assistant can guide you through specific tuning techniques!`;
    }

    // 5. Sharp notes
    if (query.includes('sharp') || query.includes('too high') || query.includes('frequency high')) {
      return `SHARP means your note is vibrating too fast (frequency is higher than target).\n\n` +
             `To LOWER the pitch and fix sharp notes:\n\n` +
             `HANDPAN:\n` +
             `• Hammer the outer boundary (ring) of the note\n` +
             `• This expands the metal, lowering the frequency\n` +
             `• Use light, precise taps rather than heavy strikes\n\n` +
             `TONGUE DRUM:\n` +
             `• Add weight to the tongue tip\n` +
             `• Use: magnets, beeswax, or small pieces of tape\n` +
             `• More weight = lower pitch`;
    }

    // 6. Flat notes
    if (query.includes('flat') || query.includes('too low') || query.includes('frequency low')) {
      return `FLAT means your note is vibrating too slow (frequency is lower than target).\n\n` +
             `To RAISE the pitch and fix flat notes:\n\n` +
             `HANDPAN:\n` +
             `• Hammer the center (dimple) of the note\n` +
             `• This compresses the metal, increasing the frequency\n` +
             `• Use a polished hammer to avoid dents\n\n` +
             `TONGUE DRUM:\n` +
             `• Remove a tiny amount of material from the tongue\n` +
             `• File carefully underneath the tip\n` +
             `• Make very small adjustments - you can always remove more`;
    }

    // 7. 432Hz vs 440Hz
    if (query.includes('432') || query.includes('440') || query.includes('hz') || query.includes('hertz') || query.includes('pitch') || query.includes('reference')) {
      return `REFERENCE PITCH (Hz) explained:\n\n` +
             `• 440Hz: The modern standard concert pitch used in most Western music\n\n` +
             `• 432Hz: Often called " Verdi pitch" - some musicians prefer it for a warmer, more natural sound\n\n` +
             `IMPORTANT: Your instrument is tuned to a specific reference!\n\n` +
             `• If your handpan says "432Hz", set that in the tuner settings\n` +
             `• If it's a standard instrument, 440Hz is typical\n\n` +
             `You can change the reference pitch in the tuner settings by tapping the Hz value.`;
    }

    // 8. Rust and Maintenance
    if (query.includes('rust') || query.includes('clean') || query.includes('care') || query.includes('maintenance') || query.includes('oil') || query.includes('protect')) {
      return `MAINTENANCE TIPS for your handpan/tongue drum:\n\n` +
             `CLEANING:\n` +
             `• Wipe after every use with a soft microfiber cloth\n` +
             `• Remove fingerprints and oils immediately\n` +
             `• Never use harsh chemicals or abrasive cleaners\n\n` +
             `OILING (for nitrided/stainless steel):\n` +
             `• Apply protective oil once a month or as needed\n` +
             `• Recommended: Phoenix Oil, Froglube, or Gun Oil\n` +
             `• Apply sparingly - a little goes a long way\n\n` +
             `STORAGE:\n` +
             `• Keep in a dry place away from humidity\n` +
             `• Use a case or bag for protection\n` +
             `• Avoid direct sunlight and temperature extremes\n\n` +
             `RUST REMOVAL:\n` +
             `• Light surface rust: Gently rub with fine steel wool (0000 grade)\n` +
             `• For deep rust: Consult a professional tuner`;
    }

    // 9. Hammering techniques
    if (query.includes('hammer') || query.includes('hammering') || query.includes('strike') || query.includes('hit')) {
      return `HAMMERING TECHNIQUES for tuning:\n\n` +
             `THE RIGHT HAMMER:\n` +
             `• Use a polished tuning hammer (rubber or plastic head)\n` +
             `• Never use metal hammers - they'll damage your instrument\n` +
             `• The handle should feel comfortable in your hand\n\n` +
             `PROPER TECHNIQUE:\n` +
             `• Let the hammer do the work - use gravity and wrist snap\n` +
             `• Light, precise taps are better than heavy blows\n` +
             `• Tap perpendicular to the surface for even results\n` +
             `• Move slowly and patiently\n\n` +
             `PATIENCE IS KEY:\n` +
             `• Make tiny adjustments\n` +
             `• Check the pitch after each tap\n` +
             `• It's easier to lower pitch than raise it\n` +
             `• Stop if you feel resistance`;
    }

    // 10. Scale information
    if (query.includes('scale') || query.includes('notes') || query.includes('dalmatian') || query.includes('kurd') || query.includes('hijaz') || query.includes('celtic') || query.includes('minor') || query.includes('major')) {
      return `SCALES for handpans and tongue drums:\n\n` +
             `COMMON SCALES:\n` +
             `• KURD (D Kurd): A minor scale - warm, melancholic, very popular\n` +
             `• HIJAZ: Exotic, eastern feel with a distinctive interval\n` +
             `• CELTIC: Open, mysterious, great for ambient music\n` +
             `• PENTATONIC: Five-note scales, easy to play, no wrong notes\n` +
             `• AHAR: Minor scale variant, similar to Kurd\n\n` +
             `WHAT SCALE DO I HAVE?\n` +
             `• Check your purchase receipt or contact the maker\n` +
             `• Each scale has a distinctive pattern of notes\n` +
             `• Play all notes and compare to online references\n\n` +
             `Select your scale in the app header to get accurate tuning feedback!`;
    }

    // 11. Tension and feel
    if (query.includes('tension') || query.includes('tight') || query.includes('loose') || query.includes('feel') || query.includes('responsive')) {
      return `TENSION in your handpan affects playability:\n\n` +
             `HIGH TENSION:\n` +
             `• Louder, more brilliant sound\n` +
             `• More responsive to light playing\n` +
             `• Can be harder on the hands\n\n` +
             `LOW TENSION:\n` +
             `• Warmer, softer tone\n` +
             `• More forgiving for beginners\n` +
             `• Quieter volume\n\n` +
             `BALANCING:\n` +
             `• Notes in the center are usually lowest tension\n` +
             `• Outer notes have higher tension\n` +
             `• Consistent tension = even response`;
    }

    // 12. Professional tuning
    if (query.includes('professional') || query.includes('tuner') || query.includes('expert') || query.includes('repair') || query.includes('send') || query.includes('factory')) {
      return `PROFESSIONAL TUNING SERVICES:\n\n` +
             `WHEN TO SEE A PRO:\n` +
             `• Multiple notes are out of tune\n` +
             `• Notes are unresponsive or dead\n` +
             `• Visible dents or damage\n` +
             `• You want to change scales\n\n` +
             `FINDING A TUNER:\n` +
             `• Search for "handpan tuner" in your area\n` +
             `• Ask your instrument maker for recommendations\n` +
             `• Look for experienced tuners with good reviews\n\n` +
             `DIY vs PROFESSIONAL:\n` +
             `• Simple adjustments: DIY with care\n` +
             `• Major work: Leave to experts\n` +
             `• You can always remove more material, but you can't add it back!`;
    }

    // 13. About the app
    if (query.includes('app') || query.includes('space tuner') || query.includes('about') || query.includes('what is this')) {
      return `SPACETUNER PRO - Your Intelligent Tuning Companion:\n\n` +
             `FEATURES:\n` +
             `• Real-time pitch detection for handpans & tongue drums\n` +
             `• AI Assistant (me!) for tuning advice and tips\n` +
             `• Tone generator for reference sounds\n` +
             `• Multiple scale support\n` +
             `• Works offline!\n\n` +
             `HOW IT WORKS:\n` +
             `1. Select your scale\n` +
             `2. Play your instrument\n` +
             `3. See if you're sharp (+) or flat (-)\n` +
             `4. Get AI-guided adjustments\n\n` +
             `For online AI with voice mode, configure your Gemini API key in settings.`;
    }

    // 14. Volume and sensitivity
    if (query.includes('volume') || query.includes('loud') || query.includes('quiet') || query.includes('sensitive') || query.includes('sensitivity')) {
      return `TUNER SENSITIVITY TIPS:\n\n` +
             `FOR BEST RESULTS:\n` +
             `• Play in a quiet environment\n` +
             `• Strike the note clearly and sustain it\n` +
             `• Hold your instrument steady\n` +
             `• Avoid other sounds in the room\n\n` +
             `IF THE TUNER ISN'T RESPONDING:\n` +
             `• Check if microphone permission is granted\n` +
             `• Play louder or closer to the microphone\n` +
             `• Make sure only one note is sounding\n\n` +
             `IF READINGS ARE JUMPY:\n` +
             `• You may be playing too softly\n` +
             `• There could be background noise\n` +
             `• Multiple notes might be ringing at once`;
    }

    // 15. Fallback - ask user what they need
    if (query.includes('?') || query.length < 10) {
      return `I'm here to help! You can ask me about:\n\n` +
             `• Tuning advice (sharp, flat, cents)\n` +
             `• Hammering techniques\n` +
             `• Scale information\n` +
             `• Maintenance and rust removal\n` +
             `• Reference pitch (432Hz vs 440Hz)\n` +
             `• Getting started with your instrument\n\n` +
             `Or tap the microphone icon for voice conversation!`;
    }

    // Default fallback
    return `I understand you're asking about "${input}".\n\n` +
           `In offline mode, I can help with:\n` +
           `• Tuning questions (sharp/flat notes)\n` +
           `• Hammering techniques\n` +
           `• Scale information\n` +
           `• Maintenance tips\n` +
           `• Reference pitch settings\n\n` +
           `Try asking: "How do I tune my handpan?" or "What is 432Hz?"`;
  }
}
