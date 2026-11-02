'use client';
import {useState} from 'react';
import {ACTIVITIES,MODULES,activityName,moduleName,normalize} from '@/lib/guide-model';
import {useResource} from './api';

type Screen={route:string;name:string;state:string;module?:string;activities?:string[];articleIds:string[];image?:boolean};
type Coverage={total:number;added:number;screenGuidance:number;excluded:number;reports:number;articlesWithImages:number;screensInventory:Screen[]};
export function CatalogCoverage({onEdit}:{onEdit:(id:string)=>void}){
 const r=useResource<Coverage>('catalog'),[search,setSearch]=useState(''),[activity,setActivity]=useState('all'),[module,setModule]=useState('all');
 const screens=r.data?.screensInventory.filter(s=>(!search||normalize(s.name).includes(normalize(search)))&&(activity==='all'||s.activities?.includes(activity))&&(module==='all'||s.module===module))??[];
 return <details className="panel" style={{marginBottom:20}}><summary className="text-link">خريطة الشاشات والتغطية المقترحة {r.data?`· ${r.data.total} سؤال وإجابة`:''}</summary>
 {r.error&&<p className="error-line">{r.error}</p>}
 {r.data&&<><p>{r.data.screenGuidance} شاشة لها إرشادات وأسئلة بيزنس، و{r.data.reports} تقرير له شرح مستقل. الصور موجودة في {r.data.articlesWithImages} مسودة من الحزمة.</p><p className="soft-note">الخريطة بتوضح المحتوى المكتوب في الحزمة، مش اعتماد تنفيذ العمليات. المسودات تحتاج مراجعة وصور لكل خطوة قبل النشر. الشاشة الملغاة مستبعدة؛ عداد تكرار أسئلة العملاء لا يتأثر بالحزمة.</p>
 <div className="admin-filters"><input aria-label="البحث عن شاشة في خريطة التغطية" type="search" placeholder="اسم الشاشة…" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="نشاط خريطة التغطية" value={activity} onChange={e=>setActivity(e.target.value)}><option value="all">كل الأنشطة</option>{ACTIVITIES.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><select aria-label="قسم خريطة التغطية" value={module} onChange={e=>setModule(e.target.value)}><option value="all">كل الأقسام</option>{MODULES.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
 <p className="muted">{screens.length} شاشة مطابقة · استورد الحزمة أولًا لو دي نسخة جديدة.</p><div className="table-wrap"><table className="data-table"><thead><tr><th>الشاشة</th><th>القسم والنشاط</th><th>الصور</th><th>الإرشادات المقترحة</th></tr></thead><tbody>{screens.map(s=><tr key={s.route}><td>{s.name}</td><td>{s.module?moduleName(s.module):'مستبعدة'}<small>{s.activities?.map(activityName).join('، ')}</small></td><td>{s.state==='excluded_removed'?'شاشة ملغاة':s.image?'لقطة فعلية متاحة':'تصوير مطلوب'}</td><td><div className="inline-actions">{s.articleIds.map((id,i)=><button className="button secondary small" key={id} onClick={()=>onEdit(id)}>{i===0?'الاستخدام والمراجعة':'سؤال البيزنس'}</button>)}{s.state==='excluded_removed'&&<span>مستبعدة حسب تأكيد صاحب المشروع</span>}</div></td></tr>)}</tbody></table></div></>}
 </details>;
}
