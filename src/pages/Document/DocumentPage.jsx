import React, { useState, useEffect, useRef } from 'react';
import Logo from '../../assets/logo.png';
import {
  BookOpen, Users, Clock, Calendar, IndianRupee,
  Briefcase, BarChart2, Shield, Settings, LayoutDashboard, Languages,
  ChevronRight, Sparkles, FileText, CheckCircle2, Globe, Phone, ExternalLink,
  Maximize2, X, ArrowRight, Layers, Eye
} from 'lucide-react';

// Lightbox Modal for Full-Screen Image Preview
const ImageModal = ({ image, onClose }) => {
  if (!image) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-sm font-bold text-slate-800 ml-2 truncate">
              {image.title || 'Image Preview'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 bg-slate-50 flex items-center justify-center max-h-[82vh] overflow-auto">
          <img
            src={image.src}
            alt={image.alt || 'Preview'}
            className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-md border border-slate-200"
          />
        </div>
      </div>
    </div>
  );
};

// Browser Frame Component for Screenshot Previews
const ImageFrame = ({ src, alt, title, onPreview }) => (
  <div
    onClick={() => onPreview({ src, alt, title })}
    className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50 shadow-2xs overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#340C8E]/40 group cursor-pointer"
  >
    <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        {title && (
          <span className="ml-2 text-xs font-semibold text-slate-500 truncate max-w-xs">
            {title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#340C8E] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 group-hover:bg-[#340C8E] group-hover:text-white transition-colors">
          Click to expand
        </span>
        <Maximize2 size={13} className="text-slate-400 group-hover:text-[#340C8E] transition-colors" />
      </div>
    </div>
    <div className="p-3 sm:p-4 bg-white relative overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto rounded-xl transition-transform duration-300 group-hover:scale-[1.004]"
      />
      <div className="absolute inset-0 bg-[#340C8E]/5 group-hover:bg-[#340C8E]/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <span className="bg-[#340C8E] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <Eye size={15} /> Fullscreen Preview
        </span>
      </div>
    </div>
  </div>
);

// SubSection Card Component with larger, readable fonts
const SubSectionCard = ({ number, title, description, imageSrc, imageAlt, onPreview }) => (
  <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 transition-all duration-300 hover:shadow-md hover:border-[#340C8E]/30 group">
    <div className="flex items-start gap-4">
      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#340C8E] text-white font-extrabold text-sm shrink-0 mt-0.5 shadow-md shadow-[#340C8E]/25">
        {number}
      </span>
      <div className="flex-1">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#340C8E] transition-colors">
          {title}
        </h3>
        <p className="text-slate-700 text-base sm:text-[16px] mt-2 leading-relaxed font-normal">
          {description}
        </p>
      </div>
    </div>
    {imageSrc && (
      <ImageFrame
        src={imageSrc}
        alt={imageAlt || title}
        title={title}
        onPreview={onPreview}
      />
    )}
  </div>
);

const DocumentPage = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [language, setLanguage] = useState('en'); // Default language
  const [previewImage, setPreviewImage] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  const t = (en, hi) => language === 'en' ? en : hi;

  const sections = [
    {
      id: 'intro',
      title: t('Introduction', 'परिचय'),
      icon: <BookOpen size={18} />,
      content: (
        <div className="space-y-8">
          {/* Main Clean Hero Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="h-2 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#340C8E] text-xs font-bold mb-4">
              <Sparkles size={14} className="text-[#340C8E]" />
              {t('Promanager Guide', 'प्रोमैनेजर गाइड')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {t('Welcome to Promanager', 'प्रोमैनेजर में आपका स्वागत है')}
            </h2>
            <p className="text-slate-700 text-base sm:text-lg mt-4 max-w-8xl leading-relaxed font-normal">
              {t(
                'Promanager is a smart and comprehensive HR & Payroll Management SaaS application. Its main objective is to simplify and automate the daily operations of any organization, such as employee tracking, attendance, leave management, shift scheduling, and payroll processing.',
                'प्रोमैनेजर एक स्मार्ट और व्यापक HR और पेरोल मैनेजमेंट SaaS एप्लीकेशन है। इसका मुख्य उद्देश्य किसी भी संगठन के दैनिक कार्यों जैसे कर्मचारी ट्रैकिंग, उपस्थिति, अवकाश प्रबंधन, शिफ्ट शेड्यूलिंग और पेरोल प्रोसेसिंग को सरल और स्वचालित बनाना है।'
              )}
            </p>
            <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-8xl leading-relaxed font-normal">
              {t(
                'Through this platform, HR teams and managers can save time and maintain transparent, error-free administration. Promanager provides a user-friendly interface that anyone can easily understand and use.',
                'इस प्लेटफॉर्म के माध्यम से, HR टीमें और मैनेजर अपना समय बचा सकते हैं और पारदर्शी, त्रुटि-मुक्त प्रशासन बनाए रख सकते हैं। प्रोमैनेजर एक उपयोग में आसान इंटरफ़ेस प्रदान करता है जिसे कोई भी आसानी से समझ और उपयोग कर सकता है।'
              )}
            </p>
          </div>

          {/* Core Modules Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <Layers className="text-[#340C8E]" size={24} />
                {t('Core Modules:', 'मुख्य मॉड्यूल:')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'dashboard',
                  icon: LayoutDashboard,
                  title: t('Dashboard Overview', 'डैशबोर्ड अवलोकन'),
                  desc: t(
                    'A quick snapshot of total employees, present staff, leaves, and daily activities of the company.',
                    'कंपनी के कुल कर्मचारियों, उपस्थित कर्मचारियों, छुट्टियों और दैनिक गतिविधियों की एक त्वरित झलक।'
                  ),
                },
                {
                  id: 'employees',
                  icon: Users,
                  title: t('Employee Management', 'कर्मचारी प्रबंधन'),
                  desc: t(
                    'Complete record of employee details, branch, department, and salary increments.',
                    'कर्मचारी विवरण, शाखा, विभाग और वेतन वृद्धि का पूरा रिकॉर्ड।'
                  ),
                },
                {
                  id: 'attendance',
                  icon: Clock,
                  title: t('Attendance & Shifts', 'उपस्थिति और शिफ्ट'),
                  desc: t(
                    'Complete control over real-time attendance tracking and flexible shift scheduling.',
                    'रीयल-टाइम उपस्थिति ट्रैकिंग और लचीली शिफ्ट शेड्यूलिंग पर पूर्ण नियंत्रण।'
                  ),
                },
                {
                  id: 'payroll',
                  icon: IndianRupee,
                  title: t('Payroll & Salary', 'पेरोल और वेतन'),
                  desc: t(
                    'Automatic, error-free salary calculation and payslip generation based on attendance.',
                    'उपस्थिति के आधार पर स्वचालित, त्रुटि-मुक्त वेतन गणना और पेस्लिप निर्माण।'
                  ),
                },
                {
                  id: 'leaves',
                  icon: Calendar,
                  title: t('Leaves & Holidays', 'छुट्टियां और अवकाश'),
                  desc: t(
                    'Manage time off effectively with integrated leave policies and holiday calendars.',
                    'एकीकृत अवकाश नीतियों और हॉलिडे कैलेंडर के साथ समय प्रबंधन प्रभावी ढंग से करें।'
                  ),
                },
                {
                  id: 'reports',
                  icon: BarChart2,
                  title: t('Reports & Analytics', 'रिपोर्ट्स और एनालिटिक्स'),
                  desc: t(
                    'Generate detailed, exportable reports to gain insights into your organization\'s operations.',
                    'अपने संगठन के संचालन में अंतर्दृष्टि प्राप्त करने के लिए विस्तृत, निर्यात योग्य रिपोर्ट तैयार करें।'
                  ),
                },
                {
                  id: 'users',
                  icon: Shield,
                  title: t('User Management', 'उपयोगकर्ता प्रबंधन'),
                  desc: t(
                    'Control who has access to the Promanager system and what they can do.',
                    'नियंत्रित करें कि प्रोमैनेजर प्रणाली तक किसकी पहुंच है और वे क्या कर सकते हैं।'
                  ),
                },
              ].map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => setActiveSection(mod.id)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#340C8E]/40 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#340C8E] flex items-center justify-center group-hover:bg-[#340C8E] group-hover:text-white transition-colors duration-200 shadow-2xs">
                        <mod.icon size={20} />
                      </div>
                      <span className="text-slate-400 group-hover:text-[#340C8E] transition-colors">
                        <ArrowRight size={17} />
                      </span>
                    </div>
                    <strong className=" font-bold text-lg sm:text-xl block group-hover:text-[#340C8E]  ">
                      {mod.title}
                    </strong>
                    <p className="text-slate-700 text-sm leading-relaxed mt-2 font-medium">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-sm font-bold text-[#340C8E] group-hover:underline">
                    <span>Explore Module →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Support Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-[#340C8E] font-bold text-lg mb-2.5 flex items-center gap-2">
                <BookOpen size={20} className="text-[#340C8E]" /> {t('Getting Started', 'शुरुआत कैसे करें')}
              </h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                {t(
                  'To understand the various features of Promanager in detail, click on the topics provided in the left sidebar.',
                  'प्रोमैनेजर की विभिन्न विशेषताओं को विस्तार से समझने के लिए, बाएँ साइडबार में दिए गए विषयों पर क्लिक करें।'
                )}
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-[#340C8E] font-bold text-lg mb-2.5 flex items-center gap-2">
                <Briefcase size={20} className="text-[#340C8E]" /> {t('Contact & Support', 'संपर्क और सहायता')}
              </h3>
              <div className="text-slate-800 text-sm leading-relaxed space-y-2">
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">{t('Website: ', 'वेबसाइट: ')}</span>
                  <a href="http://promanager.in/" className="text-[#340C8E] underline font-bold" target="_blank" rel="noopener noreferrer">http://promanager.in/</a>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">{t('Support: ', 'सहायता: ')}</span>
                  <strong className="text-slate-900 font-bold text-base">8866779008</strong>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">{t('Inquiries: ', 'पूछताछ: ')}</span>
                  <a href="https://promanager.in/contact" className="text-[#340C8E] underline font-bold" target="_blank" rel="noopener noreferrer">https://promanager.in/contact</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: t('Dashboard Overview', 'डैशबोर्ड अवलोकन'),
      icon: <LayoutDashboard size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Dashboard Overview', 'डैशबोर्ड अवलोकन')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'The dashboard gives you a quick snapshot of the most important metrics and daily activities happening across your organization.',
                'डैशबोर्ड आपको आपकी संस्था में हो रही दैनिक गतिविधियों और सबसे महत्वपूर्ण मेट्रिक्स की एक त्वरित झलक देता है।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Admin / Manager Dashboard', 'एडमिन / मैनेजर डैशबोर्ड')}
            description={t(
              'Here you can see a quick summary of total employees, present staff, and today\'s leaves. The graphs below show payroll trends and other statistics.',
              'यहाँ आप कुल कर्मचारियों, उपस्थित कर्मचारियों और आज की छुट्टियों का संक्षिप्त विवरण देख सकते हैं। नीचे दिए गए ग्राफ़ पेरोल रुझान और अन्य आंकड़े दिखाते हैं।'
            )}
            imageSrc="/document%20image/dashboard%201.png"
            imageAlt="Dashboard 1"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Analytics & Employee Data', 'एनालिटिक्स और कर्मचारी डेटा')}
            description={t(
              'The second section of the dashboard tracks recent activities, pending approvals, and employee performance metrics, facilitating quick decision-making.',
              'डैशबोर्ड का दूसरा खंड हाल की गतिविधियों, लंबित स्वीकृतियों और कर्मचारी प्रदर्शन मेट्रिक्स को ट्रैक करता है, जिससे त्वरित निर्णय लेने में मदद मिलती है।'
            )}
            imageSrc="/document%20image/dashboard%202.png"
            imageAlt="Dashboard 2"
            onPreview={setPreviewImage}
          />
        </div>
      )
    },
    {
      id: 'employees',
      title: t('Employee Management', 'कर्मचारी प्रबंधन'),
      icon: <Users size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Employee Management', 'कर्मचारी प्रबंधन')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'The core of Promanager is its robust employee database. Here you can manage all aspects of your workforce\'s organizational structure.',
                'प्रोमैनेजर का मुख्य हिस्सा इसका मजबूत कर्मचारी डेटाबेस है। यहाँ आप अपने कार्यबल के संगठनात्मक ढांचे के सभी पहलुओं का प्रबंधन कर सकते हैं।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Employee List', 'कर्मचारी सूची')}
            description={t(
              'On this page, you can view the list of all employees. Searching, filtering, and viewing employee profiles is very easy from here.',
              'इस पृष्ठ पर, आप सभी कर्मचारियों की सूची देख सकते हैं। यहाँ से कर्मचारियों को खोजना, फ़िल्टर करना और उनकी प्रोफ़ाइल देखना बहुत आसान है।'
            )}
            imageSrc="/document%20image/emp%20list1.png"
            imageAlt="Employee List"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Add Employee', 'कर्मचारी जोड़ें')}
            description={t(
              'Use this feature to onboard new employees into the system. It provides facilities for adding basic details, job roles, and uploading documents.',
              'सिस्टम में नए कर्मचारियों को जोड़ने के लिए इस सुविधा का उपयोग करें। यह मूल विवरण, नौकरी की भूमिकाएं और दस्तावेज़ अपलोड करने की सुविधा प्रदान करता है।'
            )}
            imageSrc="/document%20image/add%20Emp.png"
            imageAlt="Add Employee"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="3"
            title={t('Branch Management', 'शाखा प्रबंधन')}
            description={t(
              'Manage different branches of the company here. You can add a new branch and update the details of existing branches.',
              'यहाँ कंपनी की विभिन्न शाखाओं का प्रबंधन करें। आप एक नई शाखा जोड़ सकते हैं और मौजूदा शाखाओं का विवरण अपडेट कर सकते हैं।'
            )}
            imageSrc="/document%20image/branch1.webp"
            imageAlt="Branch"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="4"
            title={t('Department Management', 'विभाग प्रबंधन')}
            description={t(
              'Categorize and organize all departments of your organization. This helps in team reporting and filtering attendance.',
              'अपने संगठन के सभी विभागों को वर्गीकृत और व्यवस्थित करें। इससे टीम रिपोर्टिंग और उपस्थिति फ़िल्टर करने में मदद मिलती है।'
            )}
            imageSrc="/document%20image/department1.png"
            imageAlt="Department"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="5"
            title={t('Deduction', 'कटौती')}
            description={t(
              'Set salary deduction rules and categories here. These rules are automatically applied during payroll processing.',
              'यहाँ वेतन कटौती के नियम और श्रेणियाँ निर्धारित करें। ये नियम पेरोल प्रसंस्करण के दौरान स्वचालित रूप से लागू होते हैं।'
            )}
            imageSrc="/document%20image/deduction1.webp"
            imageAlt="Deduction"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="6"
            title={t('Increment', 'वेतन वृद्धि')}
            description={t(
              'Track salary increments and promotions of employees. You can easily manage historical data and new increments from here.',
              'कर्मचारियों की वेतन वृद्धि और पदोन्नति को ट्रैक करें। आप यहाँ से आसानी से ऐतिहासिक डेटा और नई वृद्धि का प्रबंधन कर सकते हैं।'
            )}
            imageSrc="/document%20image/increment1.png"
            imageAlt="Increment"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="7"
            title={t('Paid Leave', 'सवेतन अवकाश')}
            description={t(
              'Use this section to check paid leave settings and balances. This makes it easier to keep track of employee leaves.',
              'सवेतन अवकाश की सेटिंग और शेष राशि की जांच करने के लिए इस अनुभाग का उपयोग करें। इससे कर्मचारियों की छुट्टियों पर नज़र रखना आसान हो जाता है।'
            )}
            imageSrc="/document%20image/pain%20leave1.png"
            imageAlt="Paid Leave"
            onPreview={setPreviewImage}
          />
        </div>
      )
    },
    {
      id: 'attendance',
      title: t('Attendance Management', 'उपस्थिति प्रबंधन'),
      icon: <Clock size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Attendance Management', 'उपस्थिति प्रबंधन')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'Track when and where your employees are working to ensure accurate payroll and productivity tracking.',
                'सटीक पेरोल और उत्पादकता ट्रैकिंग सुनिश्चित करने के लिए ट्रैक करें कि आपके कर्मचारी कब और कहाँ काम कर रहे हैं।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Daily Attendance', 'दैनिक उपस्थिति')}
            description={t(
              'On the Daily Attendance page, you can view today\'s (current day) attendance and details of all employees at a glance. It provides a quick overview of how many employees are Present, Absent, Late, or on a Week Off.',
              'दैनिक उपस्थिति पृष्ठ पर, आप एक नज़र में आज की (वर्तमान दिन) उपस्थिति और सभी कर्मचारियों का विवरण देख सकते हैं। यह एक त्वरित अवलोकन प्रदान करता है कि कितने कर्मचारी उपस्थित, अनुपस्थित, देर से, या सप्ताह की छुट्टी पर हैं।'
            )}
            imageSrc="/document%20image/daily_attendance.png"
            imageAlt="Daily Attendance View"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Monthly Attendance', 'मासिक उपस्थिति')}
            description={t(
              'The Monthly Attendance page summarizes the attendance record for the entire month in one place, featuring a color-coded calendar view (e.g., Green = Present, Red = Absent).',
              'मासिक उपस्थिति पृष्ठ पूरे महीने के उपस्थिति रिकॉर्ड को एक स्थान पर सारांशित करता है, जिसमें रंग-कोडित कैलेंडर दृश्य (जैसे, हरा = उपस्थित, लाल = अनुपस्थित) शामिल है।'
            )}
            imageSrc="/document%20image/monthly_attendance.png"
            imageAlt="Monthly Attendance View"
            onPreview={setPreviewImage}
          />
        </div>
      )
    },
    {
      id: 'shifts',
      title: t('Shift Management', 'शिफ्ट प्रबंधन'),
      icon: <Clock size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Shift Management', 'शिफ्ट प्रबंधन')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'Create custom shift timings, assign them to different employees or departments, and manage temporary shift reallocations.',
                'कस्टम शिफ्ट समय बनाएं, उन्हें विभिन्न कर्मचारियों या विभागों को सौंपें, और अस्थायी शिफ्ट पुनर्वितरण का प्रबंधन करें।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Shifts Overview', 'शिफ्ट अवलोकन')}
            description={t(
              'Information about all shifts in the system can be viewed here. You can manage existing shifts and plan schedules for new shifts.',
              'सिस्टम में मौजूद सभी शिफ्ट्स की जानकारी यहाँ देखी जा सकती है। आप मौजूदा शिफ्ट्स का प्रबंधन कर सकते हैं और नई शिफ्ट्स के लिए कार्यक्रम की योजना बना सकते हैं।'
            )}
            imageSrc="/document%20image/shifts.png"
            imageAlt="Shifts Overview"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Create Shift', 'शिफ्ट बनाएँ')}
            description={t(
              'Define the timing, break duration, and working days to create a new shift. This shift can then be assigned to employees.',
              'नई शिफ्ट बनाने के लिए समय, ब्रेक की अवधि और कार्य दिवसों को परिभाषित करें। इसके बाद यह शिफ्ट कर्मचारियों को सौंपी जा सकती है।'
            )}
            imageSrc="/document%20image/create%20shift.png"
            imageAlt="Create Shift"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="3"
            title={t('Assign Shift', 'शिफ्ट असाइन करें')}
            description={t(
              'Assign the created shifts to specific employees or departments. You can also allocate shifts for a particular date range.',
              'बनाई गई शिफ्ट्स को विशिष्ट कर्मचारियों या विभागों को असाइन करें। आप किसी विशेष तिथि सीमा के लिए भी शिफ्ट आवंटित कर सकते हैं।'
            )}
            imageSrc="/document%20image/assign%20shift.png"
            imageAlt="Assign Shift"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="4"
            title={t('Reallocation History', 'पुनर्वितरण इतिहास')}
            description={t(
              'The entire history of any changes (reallocations) made to previously assigned shifts is tracked here to maintain transparency.',
              'पारदर्शिता बनाए रखने के लिए पहले से निर्दिष्ट शिफ्ट्स में किए गए किसी भी परिवर्तन (पुनर्वितरण) का पूरा इतिहास यहाँ ट्रैक किया जाता है।'
            )}
            imageSrc="/document%20image/reallocation%20history.png"
            imageAlt="Reallocation History"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="5"
            title={t('Shift Selection', 'शिफ्ट चयन')}
            description={t(
              'Employees or managers can easily select and update the correct shift from multiple shift options. This feature helps in flexible scheduling.',
              'कर्मचारी या प्रबंधक आसानी से कई शिफ्ट विकल्पों में से सही शिफ्ट का चयन और अद्यतन कर सकते हैं। यह सुविधा लचीले शेड्यूलिंग में मदद करती है।'
            )}
            imageSrc="/document%20image/shift%20selection.png"
            imageAlt="Shift Selection"
            onPreview={setPreviewImage}
          />
        </div>
      )
    },
    {
      id: 'leaves',
      title: t('Leaves & Holidays', 'छुट्टियाँ और अवकाश'),
      icon: <Calendar size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Leaves & Holidays', 'छुट्टियाँ और अवकाश')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'Manage time off effectively with integrated leave policies and holiday calendars.',
                'एकीकृत अवकाश नीतियों और हॉलिडे कैलेंडर के साथ समय का प्रभावी ढंग से प्रबंधन करें।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Leave List', 'अवकाश सूची')}
            description={t(
              'All employee leave requests are tracked here. Managers can approve or reject the applied leaves from this section.',
              'सभी कर्मचारी अवकाश अनुरोधों को यहाँ ट्रैक किया जाता है। प्रबंधक इस अनुभाग से लागू छुट्टियों को स्वीकृत या अस्वीकृत कर सकते हैं।'
            )}
            imageSrc="/document%20image/Leave%20list.png"
            imageAlt="Leave List"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Leave Add', 'अवकाश जोड़ें')}
            description={t(
              'Employees or admins can apply for a new leave from here, mentioning the reason and date for the leave.',
              'कर्मचारी या एडमिन छुट्टी का कारण और तारीख बताते हुए यहाँ से नई छुट्टी के लिए आवेदन कर सकते हैं।'
            )}
            imageSrc="/document%20image/leave%20add.png"
            imageAlt="Leave Add"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="3"
            title={t('Holiday List', 'हॉलिडे सूची')}
            description={t(
              'A list of all public and official company holidays is displayed here, which automatically adjusts payroll and attendance calculations.',
              'सभी सार्वजनिक और आधिकारिक कंपनी की छुट्टियों की एक सूची यहाँ प्रदर्शित की जाती है, जो स्वचालित रूप से पेरोल और उपस्थिति गणनाओं को समायोजित करती है।'
            )}
            imageSrc="/document%20image/Holiday%20list.png"
            imageAlt="Holiday List"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="4"
            title={t('Holiday Add', 'हॉलिडे जोड़ें')}
            description={t(
              'This feature is used to add new holidays (such as festivals or national holidays) to the system.',
              'इस सुविधा का उपयोग सिस्टम में नई छुट्टियां (जैसे त्यौहार या राष्ट्रीय अवकाश) जोड़ने के लिए किया जाता है।'
            )}
            imageSrc="/document%20image/holiday%20add.png"
            imageAlt="Holiday Add"
            onPreview={setPreviewImage}
          />
        </div>
      )
    },
    {
      id: 'payroll',
      title: t('Payroll & Salary', 'पेरोल और वेतन'),
      icon: <IndianRupee size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Payroll Processing', 'पेरोल प्रोसेसिंग')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'Automate your salary calculations based on attendance, leaves, allowances, and deductions.',
                'उपस्थिति, छुट्टियों, भत्तों और कटौतियों के आधार पर अपने वेतन गणना को स्वचालित करें।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Employee Salary', 'कर्मचारी वेतन')}
            description={t(
              'A detailed view of each employee\'s fixed salary, allowances, and deductions can be seen here. This data is used for base pay calculation.',
              'प्रत्येक कर्मचारी के निश्चित वेतन, भत्तों और कटौतियों का विस्तृत दृश्य यहाँ देखा जा सकता है। इस डेटा का उपयोग मूल वेतन गणना के लिए किया जाता है।'
            )}
            imageSrc="/document%20image/salary%20emp.png"
            imageAlt="Employee Salary"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Employee Payroll', 'कर्मचारी पेरोल')}
            description={t(
              'The final employee payroll generated based on attendance and leaves is verified here. After this, the payslip is finalized and distributed.',
              'उपस्थिति और छुट्टियों के आधार पर उत्पन्न अंतिम कर्मचारी पेरोल को यहाँ सत्यापित किया जाता है। इसके बाद, पेस्लिप को अंतिम रूप दिया जाता है और वितरित किया जाता है।'
            )}
            imageSrc="/document%20image/payroll%20emp.png"
            imageAlt="Employee Payroll"
            onPreview={setPreviewImage}
          />

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs mt-6">
            <h3 className="text-[#340C8E] font-bold text-lg mb-2 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-[#340C8E]" /> {t('One-Click Payroll', 'वन-क्लिक पेरोल')}
            </h3>
            <p className="text-slate-700 text-base leading-relaxed font-normal">
              {t(
                'The \'Finalize Payroll\' module allows you to generate salary slips for all employees simultaneously after reviewing the calculated amounts for the month.',
                '\'फ़ाइनलाइज़ पेरोल\' मॉड्यूल आपको महीने के लिए गणना की गई राशियों की समीक्षा करने के बाद एक साथ सभी कर्मचारियों के लिए वेतन पर्ची तैयार करने की अनुमति देता है।'
              )}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: t('Reports & Analytics', 'रिपोर्ट्स और एनालिटिक्स'),
      icon: <BarChart2 size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('Reports & Analytics', 'रिपोर्ट्स और एनालिटिक्स')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'Generate detailed, exportable reports to gain insights into your organization\'s operations.',
                'अपने संगठन के संचालन में अंतर्दृष्टि प्राप्त करने के लिए विस्तृत, निर्यात योग्य रिपोर्ट तैयार करें।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('Employee Directory Report', 'कर्मचारी निर्देशिका रिपोर्ट')}
            description={t(
              'A detailed list of all employees\' basic information and their assigned roles/departments can be viewed and exported here.',
              'सभी कर्मचारियों की बुनियादी जानकारी और उनके निर्दिष्ट भूमिकाओं/विभागों की एक विस्तृत सूची यहाँ देखी और निर्यात की जा सकती है।'
            )}
            imageSrc="/document%20image/R1%20employee_directory_clean.png"
            imageAlt="Employee Directory"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Daily Attendance Report', 'दैनिक उपस्थिति रिपोर्ट')}
            description={t(
              'A quick summary report of all punch-ins and punch-outs for the day is generated here.',
              'दिन भर के सभी पंच-इन और पंच-आउट की एक त्वरित सारांश रिपोर्ट यहाँ तैयार की जाती है।'
            )}
            imageSrc="/document%20image/R2%20daily_attendance_report_clean.png"
            imageAlt="Daily Attendance Report"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="3"
            title={t('Daily Attendance Details', 'दैनिक उपस्थिति विवरण')}
            description={t(
              'Check the detailed view of attendance for any given day, including late arrivals or early departures.',
              'किसी भी दिन के लिए उपस्थिति का विस्तृत दृश्य देखें, जिसमें देर से आना या जल्दी जाना शामिल है।'
            )}
            imageSrc="/document%20image/R3%20daily_attendance_details_clean.png"
            imageAlt="Daily Attendance Details"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="4"
            title={t('Geolocation Timeline', 'जियोलोकेशन टाइमलाइन')}
            description={t(
              'The punch-in locations and timelines of field staff or remote workers can be traced here using a map.',
              'फ़ील्ड कर्मचारियों या दूरस्थ श्रमिकों के पंच-इन स्थानों और समयसीमाओं का यहाँ मानचित्र का उपयोग करके पता लगाया जा सकता है।'
            )}
            imageSrc="/document%20image/R4%20geolocation_timeline_clean.png"
            imageAlt="Geolocation Timeline"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="5"
            title={t('Attendance Exception', 'उपस्थिति अपवाद')}
            description={t(
              'An exception report highlighting missing punches, continuous absentees, or other attendance anomalies can be found here.',
              'गायब पंच, लगातार अनुपस्थिति, या अन्य उपस्थिति विसंगतियों को उजागर करने वाली एक अपवाद रिपोर्ट यहाँ पाई जा सकती है।'
            )}
            imageSrc="/document%20image/R5%20att%20exception.png"
            imageAlt="Attendance Exception"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="6"
            title={t('Additional Analytics', 'अतिरिक्त एनालिटिक्स')}
            description={t(
              'Use this section for other detailed system reports and specific data analysis.',
              'अन्य विस्तृत सिस्टम रिपोर्ट और विशिष्ट डेटा विश्लेषण के लिए इस अनुभाग का उपयोग करें।'
            )}
            imageSrc="/document%20image/R6.png"
            imageAlt="Additional Analytics"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="7"
            title={t('Monthly Attendance Report', 'मासिक उपस्थिति रिपोर्ट')}
            description={t(
              'Get a detailed summary of attendance for the whole month from here, which includes the present, absent, and late marks of every employee.',
              'पूरे महीने की उपस्थिति का विस्तृत सारांश यहाँ से प्राप्त करें, जिसमें प्रत्येक कर्मचारी के उपस्थित, अनुपस्थित और देर से आने के निशान शामिल हैं।'
            )}
            imageSrc="/document%20image/R7.png"
            imageAlt="Monthly Attendance Report"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="8"
            title={t('Muster Roll', 'मस्टर रोल')}
            description={t(
              'A comprehensive attendance view for the entire month, which is essential for payroll and compliance requirements, can be viewed here.',
              'पूरे महीने के लिए एक व्यापक उपस्थिति दृश्य, जो पेरोल और अनुपालन आवश्यकताओं के लिए आवश्यक है, यहाँ देखा जा सकता है।'
            )}
            imageSrc="/document%20image/R8.webp"
            imageAlt="Muster Roll"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="9"
            title={t('Salary Report', 'वेतन रिपोर्ट')}
            description={t(
              'A detailed breakdown of generated salary, deductions, and allowances for all employees is included in this report.',
              'सभी कर्मचारियों के लिए उत्पन्न वेतन, कटौती और भत्तों का विस्तृत विवरण इस रिपोर्ट में शामिल है।'
            )}
            imageSrc="/document%20image/R9.png"
            imageAlt="Salary Report"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="10"
            title={t('Paid Salary Report', 'भुगतान वेतन रिपोर्ट')}
            description={t(
              'Check here to track the status and payment details of employees who have already been paid their salary.',
              'जिन कर्मचारियों को पहले ही वेतन का भुगतान किया जा चुका है, उनकी स्थिति और भुगतान विवरण ट्रैक करने के लिए यहाँ देखें।'
            )}
            imageSrc="/document%20image/R10.png"
            imageAlt="Paid Salary Report"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="11"
            title={t('Salary Generation Status', 'वेतन जनरेशन स्थिति')}
            description={t(
              'A real-time view of the current status of salary processing and how many employees are yet to have their salary generated is available here.',
              'वेतन प्रसंस्करण की वर्तमान स्थिति का रीयल-टाइम दृश्य और कितने कर्मचारियों का वेतन अभी भी उत्पन्न होना बाकी है, यह यहाँ उपलब्ध है।'
            )}
            imageSrc="/document%20image/R11.png"
            imageAlt="Salary Generation Status"
            onPreview={setPreviewImage}
          />
        </div>
      )
    },
    {
      id: 'users',
      title: t('User Management', 'उपयोगकर्ता प्रबंधन'),
      icon: <Shield size={18} />,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#340C8E] absolute top-0 left-0 right-0" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('User Management & Security', 'उपयोगकर्ता प्रबंधन और सुरक्षा')}</h2>
            <p className="text-slate-700 text-base sm:text-lg mt-2.5 leading-relaxed font-normal">
              {t(
                'Control who has access to the Promanager system and what they can do.',
                'नियंत्रित करें कि प्रोमैनेजर सिस्टम तक किसकी पहुंच है और वे क्या कर सकते हैं।'
              )}
            </p>
          </div>

          <SubSectionCard
            number="1"
            title={t('User List', 'उपयोगकर्ता सूची')}
            description={t(
              'View the list of all registered users present in the system here. You can manage existing users and control their access from here.',
              'सिस्टम में मौजूद सभी पंजीकृत उपयोगकर्ताओं की सूची यहाँ देखें। आप यहाँ से मौजूदा उपयोगकर्ताओं का प्रबंधन और उनकी पहुँच को नियंत्रित कर सकते हैं।'
            )}
            imageSrc="/document%20image/user%20list.png"
            imageAlt="User List"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="2"
            title={t('Create User', 'उपयोगकर्ता बनाएँ')}
            description={t(
              'Create user accounts for new administrative staff or managers from here and provide them with system access.',
              'यहाँ से नए प्रशासनिक कर्मचारियों या प्रबंधकों के लिए उपयोगकर्ता खाते बनाएँ और उन्हें सिस्टम पहुँच प्रदान करें।'
            )}
            imageSrc="/document%20image/create%20user.png"
            imageAlt="Create User"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="3"
            title={t('Role List', 'रोल सूची')}
            description={t(
              'All existing roles (such as HR Admin, Branch Manager) and their assigned permissions can be checked from here.',
              'सभी मौजूदा भूमिकाओं (जैसे HR एडमिन, ब्रांच मैनेजर) और उनके निर्दिष्ट अधिकारों की जाँच यहाँ से की जा सकती है।'
            )}
            imageSrc="/document%20image/role%20list.png"
            imageAlt="Role List"
            onPreview={setPreviewImage}
          />

          <SubSectionCard
            number="4"
            title={t('Create Role', 'रोल बनाएँ')}
            description={t(
              'Create custom roles and assign granular permissions to view, edit, or delete specific data.',
              'कस्टम भूमिकाएँ बनाएँ और विशिष्ट डेटा को देखने, संपादित करने, या हटाने के लिए अधिकार निर्दिष्ट करें।'
            )}
            imageSrc="/document%20image/create%20role.png"
            imageAlt="Create Role"
            onPreview={setPreviewImage}
          />
        </div>
      )
    }
  ];

  const activeSectionData = sections.find(s => s.id === activeSection);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      {/* Light Clean Executive Sidebar */}
      <div className="w-72 bg-white text-slate-800 flex flex-col shadow-sm z-20 shrink-0 border-r border-slate-200/80">
        {/* Brand Header with Logo Only */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-start">
          <img
            src={Logo}
            alt="Promanager Logo"
            className="h-10 w-auto object-contain max-w-[170px]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/logo.png";
            }}
          />
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                  ? 'bg-[#340C8E] text-white shadow-lg shadow-[#340C8E]/25 font-bold'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-[#340C8E]'
                  }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-[#340C8E]'
                  }`}>
                  {section.icon}
                </span>
                <span className="truncate text-[15px]">{section.title}</span>
              </button>
            );
          })}
        </div>


      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Floating Top Right Language Switcher */}
        <div className="absolute top-6 right-8 z-30 flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-md">
          <Languages size={16} className="text-slate-500 ml-2 mr-1" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${language === 'en'
              ? 'bg-[#340C8E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${language === 'hi'
              ? 'bg-[#340C8E] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            हिंदी
          </button>
        </div>

        {/* Scrollable Document Content Area */}
        <main ref={contentRef} className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 p-6 sm:p-8 md:p-10 mb-12 mt-4">
            {activeSectionData?.content}
          </div>
        </main>
      </div>

      {/* Lightbox Preview Modal */}
      <ImageModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};

export default DocumentPage;
