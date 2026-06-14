import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const NotFound = () => (
  <main className="flex min-h-screen items-center justify-center bg-dark-900 px-4 text-white" dir="rtl">
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href="https://santafe-fried.netlify.app/404" />
      <title>الصفحة غير موجودة | سانتافى</title>
    </Helmet>

    <section className="max-w-lg text-center">
      <p className="mb-3 text-sm font-bold text-yellow-400">404</p>
      <h1 className="mb-4 text-4xl font-black">الصفحة غير موجودة</h1>
      <p className="mb-8 text-gray-400">
        الرابط الذي تحاول الوصول إليه غير متاح. يمكنك العودة للرئيسية أو تصفح قائمة الطعام.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-zinc-950 transition hover:bg-yellow-300"
        >
          الرئيسية
        </Link>
        <Link
          to="/menu"
          className="rounded-lg border border-yellow-400/50 px-6 py-3 font-bold text-yellow-300 transition hover:border-yellow-300"
        >
          قائمة الطعام
        </Link>
      </div>
    </section>
  </main>
);

export default NotFound;
