import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => (
  <main className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 px-4 py-16 text-white" dir="rtl">
    <Helmet>
      <title>سياسة الخصوصية | سانتافيه</title>
      <meta
        name="description"
        content="سياسة خصوصية سانتافيه توضح جمع البيانات، استخدام ملفات تعريف الارتباط، ومعلومات التواصل."
      />
      <link rel="canonical" href="https://santafe-fried.netlify.app/privacy-policy" />
    </Helmet>

    <section className="mx-auto max-w-4xl">
      <Link to="/" className="mb-8 inline-block text-sm font-bold text-yellow-400 hover:text-yellow-300">
        الرجوع للرئيسية
      </Link>
      <h1 className="mb-6 text-4xl font-black text-yellow-400 md:text-5xl">سياسة الخصوصية</h1>
      <p className="mb-8 leading-8 text-gray-300">
        تهتم سانتافيه بحماية خصوصية عملائها في المنصورة وميت غمر والزقازيق. توضح هذه السياسة كيفية جمع واستخدام البيانات عند زيارة الموقع أو إرسال طلب أو الاشتراك في العروض.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-2xl font-bold">البيانات التي نجمعها</h2>
          <p className="leading-8 text-gray-400">
            قد نجمع بيانات مثل الاسم، رقم الهاتف، البريد الإلكتروني، عنوان التوصيل، تفاصيل الطلب، والفرع المختار. نستخدم هذه البيانات لتجهيز الطلبات، تحسين الخدمة، وإرسال العروض عند الاشتراك.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold">ملفات تعريف الارتباط</h2>
          <p className="leading-8 text-gray-400">
            يستخدم الموقع ملفات تعريف الارتباط لتذكر تفضيلاتك مثل الفرع المختار وتحسين تجربة التصفح. يمكنك قبول أو رفض ملفات تعريف الارتباط من الشريط الظاهر أسفل الموقع.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold">مشاركة البيانات</h2>
          <p className="leading-8 text-gray-400">
            لا نبيع بياناتك الشخصية. قد نستخدم خدمات تقنية مثل Firebase لتخزين الطلبات والاشتراكات بطريقة تساعدنا على تشغيل الموقع وخدمة العملاء.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold">معلومات التواصل</h2>
          <p className="leading-8 text-gray-400">
            للاستفسار عن الخصوصية أو تعديل بياناتك، تواصل معنا عبر البريد الإلكتروني:
            <a className="mx-1 text-yellow-400" href="mailto:santafefriedchicken@gmail.com">
              santafefriedchicken@gmail.com
            </a>
            أو من خلال صفحة التواصل.
          </p>
        </section>
      </div>
    </section>
  </main>
);

export default PrivacyPolicy;
