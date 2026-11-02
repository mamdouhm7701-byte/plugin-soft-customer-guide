'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="container not-found"><div className="empty-state"><h1>تعذر تحميل الصفحة دلوقتي</h1><p>مفيش بيانات اتغيّرت. جرّب مرة تانية أو ارجع للدليل.</p><button className="button primary" onClick={reset}>حاول مرة تانية</button><a className="button secondary" href="/">الصفحة الرئيسية</a></div></main>;}
