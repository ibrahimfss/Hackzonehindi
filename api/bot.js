import { Telegraf, Markup } from "telegraf";

/* =====================
   ENV
===================== */
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);

if (!BOT_TOKEN || !ADMIN_ID) {
  throw new Error("BOT_TOKEN or ADMIN_ID missing");
}

const bot = new Telegraf(BOT_TOKEN);

// ✅ NEW: Function to escape Markdown characters
function escapeMarkdown(text) {
  if (!text) return text;
  return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

bot.on("photo", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const photo = ctx.message.photo.pop();
  console.log("PHOTO FILE_ID:", photo.file_id);
  await ctx.reply("Photo Saved ✔️ Check Vercel Logs");
});

bot.on("video", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  console.log("VIDEO FILE_ID:", ctx.message.video.file_id);
  await ctx.reply("Video Saved ✔️ Check Vercel Logs");
});

bot.on("animation", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  console.log("GIF FILE_ID:", ctx.message.animation.file_id);
  await ctx.reply("GIF Saved ✔️ Check Vercel Logs");
});

/* =====================
   IMAGES (CHANGE LATER)
===================== */
const IMAGES = {
  WELCOME: "AgACAgUAAxkBAAOYaVC97aumEOo206nzVraCjJJcMGgAApILaxuYTYlWHwX468ujHoUBAAMCAAN3AAM2BA",
  MENU: "AgACAgUAAxkBAAPAaVDHagx9yiFwVbrzI0ZYJ5Q0UtMAAqkLaxt7J4lWwbbZV6aMDXwBAAMCAAN3AAM2BA",
  BONUS: "AgACAgUAAxkBAAPEaVDkiDvbULtInZHzfwxMvXwCqBwAAgMMaxuYTYlWDF0SIkBmqj4BAAMCAAN3AAM2BA",
  SPINS: "AgACAgUAAxkBAAPCaVDjpEDfdPo6lrG2zsdj31QR0TIAAv4LaxuYTYlWapS9I596GsQBAAMCAAN3AAM2BA",
  VOUCHER: "AgACAgUAAxkBAAPGaVDmtrymcoU5tJhUr9cxjRd72kUAAgcMaxuYTYlWY8yMY4v8geoBAAMCAAN3AAM2BA",
  LUCKY_SPINS: "AgACAgUAAxkBAAPMaVDo8z2kkKeYrPo3lZC81W4Vq0cAAg8MaxuYTYlWlLYb_5tNleUBAAMCAAN3AAM2BA",
  SUPPORT: "AgACAgUAAxkBAAPIaVDncPVV-bR7Xh-B80y2jU8Nio0AAgkMaxuYTYlWzg1-ExsNJBoBAAMCAAN3AAM2BA",
  PREDICTORS: "AgACAgUAAxkBAAPKaVDn2MeTAs3Q90LBBsIM7CX8pccAAgoMaxuYTYlWIhqImhA9N4cBAAMCAAN3AAM2BA"
};
const VIDEOS = {
  WITHDRAW: "BAACAgUAAxkBAAPOaVDx_zgMo0e8edNtvUqcSzuFqqwAArUcAAKYTYlWOlk_qMgeHLE2BA",
  DEPOSIT: "BAACAgUAAxkBAAPYaVEBqeTygLqUPN_MhNWqiXjv0PUAAu8cAAKYTYlWIq24AAHxAuJlNgQ"
};

/* =====================
   MEMORY
===================== */
const openTickets = new Map();
const adminReplyTarget = new Map();
const userTracking = new Map(); // ✅ नया: Users को track करने के लिए
let broadcastMode = new Map(); // ✅ नया: Broadcast mode track करने के लिए

/* =====================
   START
===================== */
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || "User";
  const userId = ctx.from.id;
  
  // ✅ IMPROVED: Better user tracking
  const userData = {
    id: userId,
    firstName: ctx.from.first_name || "User",
    lastName: ctx.from.last_name || "",
    username: ctx.from.username || "",
    active: true,
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    profilePhotoId: null // ✅ नया: Profile photo store करने के लिए
  };
  
  // ✅ Try to get profile photo ID
  try {
    const profilePhotos = await bot.telegram.getUserProfilePhotos(userId, 0, 1);
    if (profilePhotos.total_count > 0 && profilePhotos.photos[0]) {
      const lastPhotoSize = profilePhotos.photos[0].pop();
      userData.profilePhotoId = lastPhotoSize.file_id;
    }
  } catch (error) {
    console.error("Error getting profile photo:", error);
  }
  
  // Update or add user
  userTracking.set(userId, userData);

  await ctx.replyWithPhoto(
    IMAGES.WELCOME,
    {
      caption: 
`👋 *स्वागत है, ${firstName}!*

आपने सफलतापूर्वक *HACK ZONE SUPPORT* 🛠️ तक पहुँच बनाई है  
हमारी टीम आपकी सभी आधिकारिक सपोर्ट संबंधी जानकारियों में सहायता के लिए यहाँ है।

━━━━━━━━━━━━━━━━━━
📢 *https://t.me/+rOuALeM_WaQzODU1*
━━━━━━━━━━━━━━━━━━

जारी रखने और सपोर्ट विकल्पों तक पहुँचने के लिए, कृपया नीचे *जारी रखें* बटन पर क्लिक करें।

⚠️ *महत्वपूर्ण सूचना:*
• केवल हमारे आधिकारिक चैनल से अपडेट पर भरोसा रखें  
• सपोर्ट रिप्लाई में कुछ समय लग सकता है — कृपया धैर्य रखें।`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "▶️ जारी रखें", callback_data: "MENU" }],
          [{ text: "📢 आधिकारिक चैनल", url: "https://t.me/hack_zone_ai" }]
        ]
      }
    }
  );
});

/* =====================
   MAIN MENU (EDIT MEDIA)
===================== */
bot.action("MENU", async (ctx) => {
  const isAdmin = ctx.from.id === ADMIN_ID;
  
  const menuButtons = [
        [
          Markup.button.callback("💸 निकासी", "WITHDRAW"),
          Markup.button.callback("💳 जमा", "DEPOSIT")
        ],
        [
          Markup.button.callback("🎁 बोनस", "BONUS"),
          Markup.button.callback("🎟 वाउचर", "VOUCHER")
        ],
        [
          Markup.button.callback("🎰 स्पिन", "SPINS"),
          Markup.button.callback("🍀 लकी ड्राइव", "LUCKY_SPINS")
        ],
        [Markup.button.callback("🤖 प्रेडिक्टर बॉट", "PREDICTORS")],
        [Markup.button.callback("🧑‍💻 लाइव सपोर्ट", "SUPPORT_OPEN")],
        [Markup.button.url("📢 आधिकारिक चैनल", "https://t.me/hack_zone_ai")]
      ];
  
  // ✅ सिर्फ Admin के लिए Admin Panel button add करें
  if (isAdmin) {
    menuButtons.push([Markup.button.callback("🛡️ ADMIN PANEL", "ADMIN_PANEL")]);
  }
  
  menuButtons.push([Markup.button.url("📢 OFFICIAL CHANNEL", "https://t.me/hack_zone_ai")]);
  
  await ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.MENU,
      caption: `❓ *PLEASE SELECT YOUR QUERY*`,
      parse_mode: "Markdown"
    },
    {
      ...Markup.inlineKeyboard(menuButtons)
    }
  );
});

/* =====================
   SUPPORT OPEN
===================== */
bot.action("SUPPORT_OPEN", async (ctx) => {
  openTickets.set(ctx.from.id, true);

  await ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.SUPPORT,
      caption: 
`👨‍💻 <b>लाइव सपोर्ट अब खुला है</b>

<i>आप नीचे अपना संदेश भेज सकते हैं।</i>  
<i>सपोर्टेड फॉर्मेट: टेक्स्ट, फोटो, वीडियो।</i>

━━━━━━━━━━━━━━━━━━
📌 <b>आगे क्या होगा</b>
━━━━━━━━━━━━━━━━━━
• <i>आपका संदेश हमारी सपोर्ट प्रणाली द्वारा प्राप्त कर लिया गया है</i>  
• <i>एक सपोर्ट एजेंट आपके अनुरोध की समीक्षा करेगा</i>  
• <i>आपको जल्द से जल्द उत्तर प्राप्त होगा</i>

━━━━━━━━━━━━━━━━━━
⚠️ <b>महत्वपूर्ण नोट्स</b>
━━━━━━━━━━━━━━━━━━
• <i>तेज़ सहायता के लिए कृपया अपनी समस्या स्पष्ट रूप से बताएं</i>  
• <i>डुप्लीकेट संदेश न भेजें</i>  
• <i>प्रतिक्रिया समय कतार के आधार पर भिन्न हो सकता है</i>

<b>इस सत्र को समाप्त करने के लिए, <u>टिकट बंद करें</u> पर क्लिक करें।</b>`,
      parse_mode: "HTML"
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ टिकट बंद करें", callback_data: "SUPPORT_CLOSE" }],
          [{ text: "⬅️ पीछे", callback_data: "MENU" }]
        ]
      }
    }
  );
});

/* =====================
   SUPPORT CLOSE
===================== */
bot.action("SUPPORT_CLOSE", async (ctx) => {
  openTickets.delete(ctx.from.id);

  await ctx.editMessageCaption(
    `✅ *आपका सपोर्ट टिकट बंद कर दिया गया है।*

आप कभी भी नया टिकट खोल सकते हैं।`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅️ मेनू पर वापस", "MENU")],
        [Markup.button.url("📢 आधिकारिक चैनल", "https://t.me/hack_zone_ai")]
      ])
    }
  );
});

/* =====================
   ADMIN REPLY BUTTON
===================== */
bot.action(/^ADMIN_REPLY_(\d+)$/, async (ctx) => {
  const userId = Number(ctx.match[1]);
  adminReplyTarget.set(ctx.from.id, userId);

  await ctx.reply(
    `✍️ *उपयोगकर्ता ID: ${userId} के लिए अपना उत्तर लिखें*`,
    {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true }
    }
  );
});

/* =====================
   ADMIN CLOSE TICKET
===================== */
bot.action(/^ADMIN_CLOSE_(\d+)$/, async (ctx) => {
  const userId = Number(ctx.match[1]);

  // Remove ticket from memory
  openTickets.delete(userId);

  // Notify user
  await bot.telegram.sendMessage(
    userId,
`❌ <b>आपका सपोर्ट टिकट सपोर्ट टीम द्वारा बंद कर दिया गया है</b>

<i>यदि आपको अधिक सहायता चाहिए, तो आप कभी भी नया टिकट खोल सकते हैं।</i>`,
    { parse_mode: "HTML" }
  );

  // Confirm to admin
  await ctx.editMessageText(
    `✅ <b>टिकट सफलतापूर्वक बंद किया गया</b>\n\nउपयोगकर्ता ID: <code>${userId}</code>`,
    { parse_mode: "HTML" }
  );
});

/* =====================
   SINGLE MESSAGE HANDLER
===================== */
bot.on("message", async (ctx) => {

  /* ADMIN MESSAGE */
  if (ctx.from.id === ADMIN_ID) {
    const targetUser = adminReplyTarget.get(ctx.from.id);
    if (!targetUser) return;

    await ctx.copyMessage(targetUser);
    adminReplyTarget.delete(ctx.from.id);
    return;
  }

  /* USER MESSAGE */
  if (!openTickets.get(ctx.from.id)) return;

  await ctx.copyMessage(ADMIN_ID, {
    caption:
`📩 *नया सपोर्ट संदेश*

👤 उपयोगकर्ता: ${ctx.from.first_name || "उपयोगकर्ता"}
🆔 आईडी: ${ctx.from.id}`
  });

  await bot.telegram.sendMessage(
    ADMIN_ID,
    `⚙️ *कार्रवाई चुनें*`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("✍️ उपयोगकर्ता को जवाब दें", `ADMIN_REPLY_${ctx.from.id}`),
          Markup.button.callback("❌ टिकट बंद करें", `ADMIN_CLOSE_${ctx.from.id}`)
        ]
      ])
    }
  );

  await ctx.reply(
    `✅ *आपका संदेश सफलतापूर्वक भेजा गया है।*

कृपया धैर्य रखें। हमारी सपोर्ट टीम जल्द ही जवाब देगी।`,
    { parse_mode: "Markdown" }
  );
});

/* =====================
   INFO SECTIONS (EDIT MEDIA)
===================== */
bot.action("WITHDRAW", (ctx) =>
  ctx.editMessageMedia(
    {
      type: "video",
      media: VIDEOS.WITHDRAW,
      caption: 
`💸 *निकासी जानकारी*

━━━━━━━━━━━━━━━━━━
📌 *महत्वपूर्ण निकासी नियम*
━━━━━━━━━━━━━━━━━━
• निकासी केवल खाता सत्यापन पूरा करने के बाद उपलब्ध है  
• न्यूनतम निकासी राशि चुने गए भुगतान तरीके पर निर्भर करती है  
• अनुरोध सबमिट करने से पहले अपना भुगतान विवरण सही सुनिश्चित करें  

━━━━━━━━━━━━━━━━━━
⏳ *प्रसंस्करण समय*
━━━━━━━━━━━━━━━━━━
• क्रिप्टो करेंसी / PAYTM, PHONEPE यूपीआई: आमतौर पर 
5-30 मिनट के भीतर  
• बैंक ट्रांसफर: 24 घंटे तक

━━━━━━━━━━━━━━━━━━
⚠️ *महत्वपूर्ण सूचना*
━━━━━━━━━━━━━━━━━━
• केवल अपना स्वयं का भुगतान विवरण उपयोग करें  
• एक ही समय में कई निकासी का प्रयास न करें  
• 1win की शर्तों का कोई भी उल्लंघन निकासी में देरी या अस्वीकृति का कारण बन सकता है

_यदि आपकी निकासी लंबित है, तो कृपया धैर्य रखें।_

आगे बढ़ने के लिए *अभी निकासी करें* पर क्लिक करें।`,
      parse_mode: "Markdown"
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💸 अभी निकासी करें", url: "https://lkxw.cc/6706" }],
          [{ text: "⬅️ पीछे", callback_data: "MENU" }],
          [{ text: "📢 आधिकारिक चैनल", url: "https://t.me/hack_zone_ai" }]
        ]
      }
    }
  )
);

bot.action("DEPOSIT", (ctx) =>
  ctx.editMessageMedia(
    {
      type: "video",
      media: VIDEOS.DEPOSIT,
      caption: 
`‎💳 *1WIN जमा जानकारी*
‎
‎━━━━━━━━━━━━━━━━━━
‎📌 *महत्वपूर्ण जमा नियम*
‎━━━━━━━━━━━━━━━━━━
‎• जमा केवल अपने स्वयं के भुगतान तरीके से करें  
‎• न्यूनतम जमा राशि चुने गए भुगतान विकल्प पर निर्भर करती है  
‎• भुगतान की पुष्टि करने से पहले जमा राशि अवश्य जांचें 
‎
‎━━━━━━━━━━━━━━━━━━
‎⚡ *जमा प्रसंस्करण समय*
‎━━━━━━━━━━━━━━━━━━
‎• Paytm, Phonepe, UPI / क्रिप्टो: तुरंत से कुछ मिनट  
‎• बैंक ट्रांसफर: 15-30 मिनट तक लग सकते हैं 
‎
‎━━━━━━━━━━━━━━━━━━
‎🎁 *बोनस और प्रोमोकोड*
‎━━━━━━━━━━━━━━━━━━
‎• पंजीकरण के दौरान सही *प्रोमोकोड* \`INDIANARMY\` दर्ज करें ताकि *600% जमा बोनस* प्राप्त कर सकें  
‎• बोनस वेजरिंग आवश्यकताओं के अधीन हैं  
‎• गलत या गायब प्रोमोकोड बोनस को रद्द कर सकता है
‎
‎━━━━━━━━━━━━━━━━━━
‎⚠️ *महत्वपूर्ण सूचना*
‎━━━━━━━━━━━━━━━━━━
‎_• भुगतान के दौरान ऐप बंद न करें या पेज रिफ्रेश न करें  
‎• बैलेंस क्रेडिट होने तक लेनदेन आईडी सहेज कर रखें  
‎• विफल जमा के लिए, केवल आधिकारिक 1win सपोर्ट से संपर्क करें_
‎
‎आगे बढ़ने के लिए *अभी जमा करें* पर क्लिक करें।`,
      parse_mode: "Markdown"
    },
    {
      ...Markup.inlineKeyboard([
        [Markup.button.url("अभी जमा करें", "https://lkxw.cc/6706")],
        [Markup.button.callback("⬅️ पीछे", "MENU")],
        [Markup.button.url("📢 आधिकारिक चैनल", "https://t.me/hack_zone_ai")]
      ])
    }
  )
);

bot.action("BONUS", (ctx) =>
  ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.BONUS,
      caption: 
`🎁 *एक्सक्लूसिव डिपॉज़िट बोनस*  
_एक्सप्रेस बेट पर 5 या उससे अधिक इवेंट्स लगाने पर, आपकी जीत की राशि पर अतिरिक्त प्रतिशत नेट प्रॉफिट में जोड़ दिया जाएगा._  

रजिस्ट्रेशन और डिपॉज़िट के समय \`INDIANARMY\` प्रोमोकोड का उपयोग करें और अपने बोनस अनलॉक करें।  

━━━━━━━━━━━━━━━━━━
💱 *कैशबैक*
━━━━━━━━━━━━━━━━━━
• कैसिनो में 30% तक कैशबैक — हर हफ्ते अपने नुकसान का 30% तक वापस पाएं।  

━━━━━━━━━━━━━━━━━━
🎁 *बोनस*
━━━━━━━━━━━━━━━━━━
• पहले 4 डिपॉज़िट पर *500%* तक वेलकम बोनस।  

• क्रिप्टोकरेंसी डिपॉज़िट पर पहले 4 डिपॉज़िट के लिए *600%* तक बोनस।  

━━━━━━━━━━━━━━━━━━
🎯 *बोनस कोड:* \`INDIANARMY\`
━━━━━━━━━━━━━━━━━━

📌 *महत्वपूर्ण:*
• रजिस्ट्रेशन या डिपॉज़िट कन्फर्म करने से पहले \`INDIANARMY\` प्रोमोकोड दर्ज करना आवश्यक है  
• बोनस केवल योग्य डिपॉज़िट पर लागू होता है  

सभी प्रमोशन और बोनस के बारे में अधिक जानने के लिए *बोनस क्लेम करें* बटन पर क्लिक करें।  

_अभी डिपॉज़िट करें और अपनी जीतने की संभावना बढ़ाएं._  

आगे बढ़ने के लिए *बोनस प्राप्त करें* पर क्लिक करें।`,
      parse_mode: "Markdown"
    },
    {
      ...Markup.inlineKeyboard([
        [Markup.button.url("बोनस प्राप्त करें", "https://lkxw.cc/6706")],
        [Markup.button.callback("⬅️ पीछे", "MENU")],
        [Markup.button.url("📢 आधिकारिक चैनल", "https://t.me/hack_zone_ai")]
      ])
    }
  )
);

bot.action("VOUCHER", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.VOUCHER,
      caption: 
`🎟️ <b>1WIN वाउचर और प्रोमो कोड</b>

<i>अपने बैलेंस को बढ़ाने और इनाम को अधिकतम करने के लिए विशेष 1win वाउचर कोड प्राप्त करें।</i>

━━━━━━━━━━━━━━━━━━
📌 <b>दैनिक वाउचर कैसे प्राप्त करें</b>
━━━━━━━━━━━━━━━━━━
• हमारे <a href="https://t.me/hack_zone_ai"><b>आधिकारिक टेलीग्राम चैनल</b></a> से जुड़ें  
• दैनिक वाउचर कोड केवल चैनल में साझा किए जाते हैं  
• वाउचर सीमित हैं और थोड़े समय के लिए उपलब्ध हैं  
• कोड केवल योग्य उपयोगकर्ताओं के लिए मान्य हैं  

━━━━━━━━━━━━━━━━━━
⚠️ <b>महत्वपूर्ण सूचना</b>
━━━━━━━━━━━━━━━━━━
• वाउचर केवल <a href="https://t.me/hack_zone_ai"><b>आधिकारिक चैनल</b></a> स्रोतों द्वारा प्रदान किए जाते हैं  
• प्रत्येक वाउचर की विशेष शर्तें हो सकती हैं  
• समय सीमा समाप्त या पहले उपयोग किए गए वाउचर का पुन: उपयोग नहीं किया जा सकता  

दैनिक वाउचर कोड प्राप्त करने के लिए <a href="https://t.me/hack_zone_ai"><b>आधिकारिक चैनल</b></a> से अभी जुड़ें।

आगे बढ़ने के लिए <b>वाउचर प्राप्त करें</b> पर क्लिक करें।`,
      parse_mode: "HTML"
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎟️ वाउचर प्राप्त करें", url: "https://t.me/hack_zone_ai" }],
          [{ text: "⬅️ पीछे", callback_data: "MENU" }],
          [{ text: "📢 आधिकारिक चैनल", url: "https://t.me/hack_zone_ai" }]
        ]
      }
    }
  );
});

bot.action("SPINS", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.SPINS,
      caption: 
`🎰 <b>मुफ्त स्पिन ऑफर</b>

<i>मुफ्त स्पिन प्राप्त करें और अपनी जीत की संभावना को तुरंत बढ़ाएं।</i>

━━━━━━━━━━━━━━━━━━
📌 <b>यह कैसे काम करता है</b>
━━━━━━━━━━━━━━━━━━
• अपने खाते में लॉगिन / रजिस्टर करें  
• योग्य जमा करें  
• मुफ्त स्पिन स्वचालित रूप से क्रेडिट कर दी जाएंगी  

━━━━━━━━━━━━━━━━━━
⚠️ <b>महत्वपूर्ण</b>
━━━━━━━━━━━━━━━━━━
• स्पिन वेजरिंग नियमों के अधीन हैं  
• केवल चयनित गेम्स के लिए मान्य  
• एक उपयोगकर्ता पर एक ऑफर

जारी रखने के लिए <b>स्पिन प्राप्त करें</b> पर क्लिक करें।`,
      parse_mode: "HTML"
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎰 स्पिन प्राप्त करें", url: "https://lkxw.cc/6706" }],
          [{ text: "⬅️ पीछे", callback_data: "MENU" }],
          [{ text: "📢 आधिकारिक चैनल", url: "https://t.me/hack_zone_ai" }]
        ]
      }
    }
  );
});

bot.action("LUCKY_SPINS", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.LUCKY_SPINS,
      caption: `🍀 <b>लकी ड्राइव 🎫 एक लकी टिकट निकालें और बड़ी जीतें! 🎫</b>

<i>हर दिन, अधिक 1win खिलाड़ी अपनी किस्मत को वास्तविकता में बदल रहे हैं — नई सुपरकार चलाते हुए और लक्जरी जीवनशैली का आनंद ले रहे हैं।  
कैसे? फ्री मनी सेक्शन में गोल्डन टिकट इकट्ठा करके और लकी ड्राइव में भाग लेकर।</i>

━━━━━━━━━━━━━━━━━━
🚗 <b>लकी ड्राइव – सीजन इनाम</b>
━━━━━━━━━━━━━━━━━━
• 🏆 ग्रैंड प्राइज  
• पोर्श GT3 RS  
• विशेष स्पिन इनाम  
• सीमित समय की घटना  

━━━━━━━━━━━━━━━━━━
⚠️ <b>प्रीमियम अतिरिक्त इनाम</b>
━━━━━━━━━━━━━━━━━━
• iPhone 17 Pro Max  
• MacBook Pro 14 (M3)  
• AirPods Max  

━━━━━━━━━━━━━━━━━━
🎰 <b>प्रतिभागियों के लिए बोनस</b>
━━━━━━━━━━━━━━━━━━
• <b>फ्री स्पिन</b> हर उस व्यक्ति के लिए जो 7 या अधिक टिकट इकट्ठा करता है  

━━━━━━━━━━━━━━━━━━
⚠️ <b>भागीदारी आवश्यकता:</b>
━━━━━━━━━━━━━━━━━━
लकी ड्राइव में भाग लेने के लिए, आपके खाते में <b>कम से कम ₹1000 या अधिक का एक जमा होना चाहिए।</b>

🎫 <b>टिकट इकट्ठा करें। अपनी संभावनाएं बढ़ाएं। लक्जरी के साथ दूर जाएं।</b>

अभी <b>अपना भाग्य आजमाएं</b> पर क्लिक करें।`,
      parse_mode: "HTML"
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🍀 अपना भाग्य आजमाएं", url: "https://lkxw.cc/6706" }],
          [{ text: "⬅️ पीछे", callback_data: "MENU" }],
          [{ text: "📢 आधिकारिक चैनल", url: "https://t.me/hack_zone_ai" }]
        ]
      }
    }
  );
});

/* =====================
   PREDICTOR BOTS
===================== */
bot.action("PREDICTORS", (ctx) =>
  ctx.editMessageMedia(
    {
      type: "photo",
      media: IMAGES.PREDICTORS,
      caption: `🤖 *नीचे दिए गए प्रेडिक्टर और हैक बॉट का उपयोग करके अपनी कमाई बढ़ाएं और अपनी जीत की संभावना बढ़ाएं*।`,
      parse_mode: "Markdown"
    },
    {
      ...Markup.inlineKeyboard([
        [Markup.button.url("✈️ एविएटर हैक", "https://t.me/aviator_predict_vipbot?start=ar1465380042")],
        [Markup.button.url("💣 माइंस हैक", "https://t.me/Mines_hacke_bot?start=ar1465380042")],
        [Markup.button.url("👑 किंग थिंबल्स", "https://t.me/King_thimblesbot?start=ar1465380042")],
        [Markup.button.callback("⬅️ पीछे", "MENU")],
        [Markup.button.url("📢 आधिकारिक चैनल", "https://t.me/hack_zone_ai")]
      ])
    }
  )
);

/* =====================
   VERCEL HANDLER
===================== */
export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } catch (e) {
    console.error(e);
  }
  res.status(200).send("OK");
}
