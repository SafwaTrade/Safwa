import { createClient } from "@supabase/supabase-js";
import { placeholderCategories, placeholderProducts, companyInfo } from "../data/placeholder";

async function runSeed() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("❌ Supabase URL or Anon Key is missing from env.");
    return;
  }

  console.log(`🔌 Connecting to Supabase at: ${url}`);
  const supabase = createClient(url, anonKey);

  try {
    console.log("🧹 1. Cleaning up existing test data in correct order...");

    // 1. Delete product images
    const { error: imgDelErr } = await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (imgDelErr) {
      console.warn("⚠️ Warning deleting product_images (might be empty or RLS restricted):", imgDelErr.message);
    } else {
      console.log("✅ Cleared product_images table.");
    }

    // 2. Delete products
    const { error: prodDelErr } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (prodDelErr) {
      console.warn("⚠️ Warning deleting products:", prodDelErr.message);
    } else {
      console.log("✅ Cleared products table.");
    }

    // 3. Delete categories
    const { error: catDelErr } = await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (catDelErr) {
      console.warn("⚠️ Warning deleting categories:", catDelErr.message);
    } else {
      console.log("✅ Cleared categories table.");
    }

    // 4. Delete contact requests
    const { error: contactDelErr } = await supabase.from("contact_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (contactDelErr) {
      console.warn("⚠️ Warning deleting contact_requests:", contactDelErr.message);
    } else {
      console.log("✅ Cleared contact_requests table.");
    }

    // 5. Delete maintenance requests
    const { error: maintDelErr } = await supabase.from("maintenance_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (maintDelErr) {
      console.warn("⚠️ Warning deleting maintenance_requests:", maintDelErr.message);
    } else {
      console.log("✅ Cleared maintenance_requests table.");
    }

    // 6. Delete site content CMS
    const { error: siteDelErr } = await supabase.from("site_content").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (siteDelErr) {
      console.warn("⚠️ Warning deleting site_content (might be empty or RLS restricted):", siteDelErr.message);
    } else {
      console.log("✅ Cleared site_content table.");
    }

    console.log("📥 2. Seeding Categories...");
    const categoriesToInsert = placeholderCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image_url: c.image_url,
      description: c.description
    }));

    const { error: catInsertErr } = await supabase.from("categories").insert(categoriesToInsert);
    if (catInsertErr) {
      throw new Error(`Failed to insert categories: ${catInsertErr.message}`);
    }
    console.log(`✅ Successfully seeded ${categoriesToInsert.length} categories.`);

    console.log("📥 3. Seeding Products...");
    const productsToInsert = placeholderProducts.map(p => ({
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      slug: p.slug,
      short_description: p.short_description,
      full_description: p.full_description,
      specs: p.specs,
      price: p.price,
      is_featured: p.is_featured,
      is_available: p.is_available,
      features: p.features
    }));

    const { error: prodInsertErr } = await supabase.from("products").insert(productsToInsert);
    if (prodInsertErr) {
      throw new Error(`Failed to insert products: ${prodInsertErr.message}`);
    }
    console.log(`✅ Successfully seeded ${productsToInsert.length} products.`);

    console.log("📥 4. Seeding Product Images Gallery...");
    const imagesToInsert: any[] = [];
    placeholderProducts.forEach(p => {
      if (p.images && p.images.length > 0) {
        p.images.forEach((url, index) => {
          imagesToInsert.push({
            product_id: p.id,
            image_url: url,
            sort_order: index
          });
        });
      }
    });

    if (imagesToInsert.length > 0) {
      const { error: imgInsertErr } = await supabase.from("product_images").insert(imagesToInsert);
      if (imgInsertErr) {
        throw new Error(`Failed to insert product images: ${imgInsertErr.message}`);
      }
      console.log(`✅ Successfully seeded ${imagesToInsert.length} gallery images.`);
    }

    console.log("📥 5. Seeding Site Content CMS...");
    const siteContentToInsert = [
      { key: "home_hero_badge", value: "الوكيل الرسمي والمعتمد لأقوى الأجهزة المنزلية والكهربائية", content_type: "text" },
      { key: "home_hero_title", value: companyInfo.name, content_type: "text" },
      { key: "home_hero_tagline", value: companyInfo.tagline, content_type: "text" },
      { key: "home_hero_description", value: companyInfo.description, content_type: "text" },
      { key: "home_hero_image", value: "/src/assets/images/industrial_tools_hero_1783623168872.jpg", content_type: "image" },
      { key: "home_maint_section_title", value: "صيانة منزلية أصلية بقطع غيار معتمدة", content_type: "text" },
      { key: "home_maint_section_desc", value: "لا نكتفي ببيع المنتجات فحسب، بل لدينا مركز صيانة متكامل مجهز بأحدث أدوات الفحص، مع فريق من المهندسين والفنيين المدربين لضمان بقاء أجهزتك المنزلية بأفضل حالة تشغيلية ممكنة وبأقل التكاليف وبأعلى جودة وأمان.", content_type: "text" },
      { key: "warranty_hero_badge", value: "خدمة ما بعد البيع والدعم المعتمد", content_type: "text" },
      { key: "warranty_hero_title", value: "صيانة منزلية أصلية بقطع غيار معتمدة وضمان حقيقي", content_type: "text" },
      { key: "warranty_hero_description", value: `في شركة ${companyInfo.name}، نلتزم بتقديم أعلى مستويات الدعم الفني لأجهزتك المنزلية والكهربائية لضمان كفاءة تشغيلها وعمرها الافتراضي الطويل. نعتمد فقط على قطع غيار أصلية بنسبة 100% من المصانع وبإشراف مهندسين متخصصين وفنيين محترفين.`, content_type: "text" },
      { key: "warranty_duration_text", value: "12 شهراً كاملة", content_type: "text" },
      { key: "warranty_duration_desc", value: "يسري الضمان من تاريخ الشراء المدون في الفاتورة الرسمية أو بطاقة الضمان.", content_type: "text" },
      { key: "warranty_level_text", value: "قطع غيار أصلية 100%", content_type: "text" },
      { key: "warranty_level_desc", value: "استبدال مجاني للأجزاء التالفة طوال فترة الضمان ضد عيوب الصناعة مع تقديم فاتورة الصيانة المعتمدة.", content_type: "text" },
      { key: "warranty_covered_terms", value: "الأعطال الفنية والعيوب المصنعية الناتجة عن التشغيل والظروف العادية للأجهزة المنزلية.\nعيوب المواد الخام وجودة التصنيع من المصنع مباشرة.\nأخطاء التجميع الداخلي للأجزاء الميكانيكية والكهربائية للمحركات.", content_type: "text" },
      { key: "warranty_not_covered_terms", value: "الأعطال الناتجة عن سوء الاستخدام، التحميل الزائد، أو سقوط الأجهزة وصدمها.\nالأضرار الناجمة عن سوء التوصيل الكهربائي أو عدم ثبات شدة التيار بمقر العميل.\nالتشغيل على تيار كهربائي غير مطابق للمواصفات الفنية الموصى بها في الكتيب.\nتنبيه هام: محاولة فتح الجهاز، تعديله، أو عمل صيانة له خارج مركز الصيانة المعتمد لشركة الصفوة يسقط الضمان فوراً.", content_type: "text" },
      { key: "warranty_note", value: "الرجاء الاحتفاظ بفاتورة الشراء الأصلية وبطاقة الضمان المختومة من الوكيل لتقديمها عند طلب الصيانة لضمان إثبات تاريخ الشراء وحالة التفعيل.", content_type: "text" },
      { key: "maintenance_terms_title", value: "مزايا وشروط الصيانة الدورية والخارجية", content_type: "text" },
      { key: "maintenance_terms_desc", value: "خدمة احترافية ممتدة وسريعة حتى بعد انتهاء فترة الضمان", content_type: "text" },
      { key: "maintenance_term_1_title", value: "فحص وتحديد دقيق للمشكلات", content_type: "text" },
      { key: "maintenance_term_1_desc", value: "يتم فحص الأجهزة المنزلية باستخدام أجهزة قياس تشخيصية متطورة لتحديد سبب العطل الفعلي بدقة وتجنب التغيير العشوائي للقطع.", content_type: "text" },
      { key: "maintenance_term_2_title", value: "توفير قطع الغيار بأسعار مخفضة", content_type: "text" },
      { key: "maintenance_term_2_desc", value: "نوفر كافة قطع الغيار ومستلزمات التشغيل كالمحركات، الكروت الإلكترونية، السيور ومفاتيح التشغيل بأسعار المصنع الأصلية المخفضة مع تقديم ضمان على قطع الغيار المستبدلة.", content_type: "text" },
      { key: "maintenance_term_3_title", value: "شفافية كاملة وتكاليف واضحة", content_type: "text" },
      { key: "maintenance_term_3_desc", value: "بعد انتهاء فترة الضمان، نقوم بتقديم فحص فني مبدئي مجاني وتقدير إجمالي لتكلفة الصيانة والمصنعية قبل البدء في التنفيذ ليكون العميل على دراية كاملة بجميع التفاصيل.", content_type: "text" },
      { key: "about_hero_title", value: `شركة ${companyInfo.name} للأجهزة المنزلية والكهربائية`, content_type: "text" },
      { key: "about_hero_description", value: "تأسست الشركة لتقديم حلول متطورة وأجهزة منزلية متميزة تدوم طويلاً لتسهيل وتحسين جودة الحياة اليومية لكل عائلة في مصر والشرق الأوسط.", content_type: "text" },
      { key: "about_banner_badge", value: "تأسسنا عام 2011", content_type: "text" },
      { key: "about_banner_text", value: "نسير بخطى ثابتة نحو توفير أرقى الابتكارات والأجهزة المنزلية المريحة", content_type: "text" },
      { key: "about_mission_title", value: "رسالتنا", content_type: "text" },
      { key: "about_mission_desc", value: "نسعى دائماً لتوفير أجهزة منزلية وكهربائية عالية الكفاءة بمواصفات مطابقة لأعلى المعايير العالمية، بأسعار تنافسية تناسب السوق المحلي، مع تقديم دعم فني وصيانة منزلية احترافية لعملائنا لتمكينهم من الاستمتاع بأعلى درجات الراحة والأمان.", content_type: "text" },
      { key: "about_vision_title", value: "رؤيتنا", content_type: "text" },
      { key: "about_vision_desc", value: "أن نكون الخيار الأول والوكيل الأبرز لكل منزل وعائلة في مصر والشرق الأوسط تبحث عن الأجهزة الموثوقة التي تتميز بالجمال والتحمل الفائق والذكاء التكنولوجي الحديث.", content_type: "text" },
      { key: "about_why_choose_us", value: `لماذا يختار ملايين العملاء شركة ${companyInfo.name}؟`, content_type: "text" },
      { key: "about_value_1_title", value: "الجودة والضمان الصارم", content_type: "text" },
      { key: "about_value_1_desc", value: "نخضع جميع الأجهزة لاختبارات أداء وسلامة صارمة قبل طرحها لضمان كفاءة تشغيلها ومطابقتها للمواصفات القياسية.", content_type: "text" },
      { key: "about_value_2_title", value: "أفضل خدمة صيانة ما بعد البيع", content_type: "text" },
      { key: "about_value_2_desc", value: "شراكتنا معك تبدأ بعد الشراء؛ حيث نوفر فريقاً سريعاً لخدمة الصيانة المنزلية وتوفير قطع الغيار الأصلية مع ضمان معتمد.", content_type: "text" },
      { key: "about_value_3_title", value: "التطور والتوفير الذكي", content_type: "text" },
      { key: "about_value_3_desc", value: "نهتم بتوفير أجهزة كهربائية مجهزة بمحركات إنفرتر الذكية الموفرة للطاقة بنسب عالية وذات أداء فائق الهدوء وعمر أطول للجهاز.", content_type: "text" },
      { key: "about_page_image", value: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=1200", content_type: "image" },
      { key: "footer_phone", value: companyInfo.phone, content_type: "text" },
      { key: "footer_email", value: companyInfo.email, content_type: "text" },
      { key: "footer_address", value: companyInfo.address, content_type: "text" },
      { key: "footer_whatsapp_number", value: companyInfo.whatsapp, content_type: "text" },
      { key: "footer_facebook", value: companyInfo.socials.facebook, content_type: "text" },
      { key: "footer_instagram", value: companyInfo.socials.instagram, content_type: "text" },
      { key: "footer_linkedin", value: companyInfo.socials.linkedin, content_type: "text" },
      { key: "top_bar_badge_text", value: "الكتالوج الرسمي المعتمد 2026", content_type: "text" },
      { key: "maintenance_feature_enabled", value: "true", content_type: "boolean" }
    ];

    const { error: siteInsertErr } = await supabase.from("site_content").insert(siteContentToInsert);
    if (siteInsertErr) {
      console.warn("⚠️ Warning seeding site_content (might be RLS restricted):", siteInsertErr.message);
    } else {
      console.log(`✅ Successfully seeded ${siteContentToInsert.length} site content CMS items.`);
    }

    console.log("\n🚀 DATABASE SEED COMPLETED SUCCESSFULLY!");
  } catch (err: any) {
    console.error("\n❌ Database seeding failed:", err.message);
    console.log("\n💡 Keep in mind that if Supabase Row Level Security (RLS) is active and restricts public writes, you should copy and execute the SQL seed script in '/src/db/seed_real_data.sql' via your Supabase SQL Editor Dashboard, as the anon key doesn't bypass write RLS rules.");
  }
}

runSeed();
