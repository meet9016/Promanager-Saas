import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Users, Clock, Calendar, IndianRupee,
  Briefcase, BarChart2, Shield, Settings, LayoutDashboard, Languages
} from 'lucide-react';

const DocumentPage = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [language, setLanguage] = useState('hi'); // Default language
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
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-800">{t('Welcome to Promanager', 'प्रोमैनेजर में आपका स्वागत है')}</h2>
          </div>
          
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              {t(
                'Promanager is a smart and comprehensive HR & Payroll Management SaaS application. Its main objective is to simplify and automate the daily operations of any organization, such as employee tracking, attendance, leave management, shift scheduling, and payroll processing.',
                'प्रोमैनेजर एक स्मार्ट और व्यापक HR और पेरोल मैनेजमेंट SaaS एप्लीकेशन है। इसका मुख्य उद्देश्य किसी भी संगठन के दैनिक कार्यों जैसे कर्मचारी ट्रैकिंग, उपस्थिति, अवकाश प्रबंधन, शिफ्ट शेड्यूलिंग और पेरोल प्रोसेसिंग को सरल और स्वचालित बनाना है।'
              )}
            </p>
            <p>
              {t(
                'Through this platform, HR teams and managers can save time and maintain transparent, error-free administration. Promanager provides a user-friendly interface that anyone can easily understand and use.',
                'इस प्लेटफॉर्म के माध्यम से, HR टीमें और मैनेजर अपना समय बचा सकते हैं और पारदर्शी, त्रुटि-मुक्त प्रशासन बनाए रख सकते हैं। प्रोमैनेजर एक उपयोग में आसान इंटरफ़ेस प्रदान करता है जिसे कोई भी आसानी से समझ और उपयोग कर सकता है।'
              )}
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t('Core Modules:', 'मुख्य मॉड्यूल:')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutDashboard size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('Dashboard Overview', 'डैशबोर्ड अवलोकन')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'A quick snapshot of total employees, present staff, leaves, and daily activities of the company.',
                    'कंपनी के कुल कर्मचारियों, उपस्थित कर्मचारियों, छुट्टियों और दैनिक गतिविधियों की एक त्वरित झलक।'
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('Employee Management', 'कर्मचारी प्रबंधन')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'Complete record of employee details, branch, department, and salary increments.',
                    'कर्मचारी विवरण, शाखा, विभाग और वेतन वृद्धि का पूरा रिकॉर्ड।'
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('Attendance & Shifts', 'उपस्थिति और शिफ्ट')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'Complete control over real-time attendance tracking and flexible shift scheduling.',
                    'रीयल-टाइम उपस्थिति ट्रैकिंग और लचीली शिफ्ट शेड्यूलिंग पर पूर्ण नियंत्रण।'
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('Payroll & Salary', 'पेरोल और वेतन')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'Automatic, error-free salary calculation and payslip generation based on attendance.',
                    'उपस्थिति के आधार पर स्वचालित, त्रुटि-मुक्त वेतन गणना और पेस्लिप निर्माण।'
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('Leaves & Holidays', 'छुट्टियां और अवकाश')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'Manage time off effectively with integrated leave policies and holiday calendars.',
                    'एकीकृत अवकाश नीतियों और हॉलिडे कैलेंडर के साथ समय प्रबंधन प्रभावी ढंग से करें।'
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('Reports & Analytics', 'रिपोर्ट्स और एनालिटिक्स')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'Generate detailed, exportable reports to gain insights into your organization\'s operations.',
                    'अपने संगठन के संचालन में अंतर्दृष्टि प्राप्त करने के लिए विस्तृत, निर्यात योग्य रिपोर्ट तैयार करें।'
                  )}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-indigo-600" />
                  <strong className="text-gray-800">{t('User Management', 'उपयोगकर्ता प्रबंधन')}</strong>
                </div>
                <p className="text-sm text-gray-600">
                  {t(
                    'Control who has access to the Promanager system and what they can do.',
                    'नियंत्रित करें कि प्रोमैनेजर प्रणाली तक किसकी पहुंच है और वे क्या कर सकते हैं।'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mt-8">
            <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
              <BookOpen size={18} /> {t('Getting Started', 'शुरुआत कैसे करें')}
            </h3>
            <p className="text-blue-700 text-sm">
              {t(
                'To understand the various features of Promanager in detail, click on the topics provided in the left sidebar.',
                'प्रोमैनेजर की विभिन्न विशेषताओं को विस्तार से समझने के लिए, बाएँ साइडबार में दिए गए विषयों पर क्लिक करें।'
              )}
            </p>
          </div>

          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100 mt-4">
            <h3 className="text-indigo-800 font-semibold mb-2 flex items-center gap-2">
              <Briefcase size={18} /> {t('Contact & Support', 'संपर्क और सहायता')}
            </h3>
            <div className="text-indigo-700 text-sm leading-relaxed space-y-1">
              <p>
                {t('Website: ', 'वेबसाइट: ')}
                <a href="http://promanager.in/" className="font-medium underline hover:text-indigo-900" target="_blank" rel="noopener noreferrer">http://promanager.in/</a>
              </p>
              <p>
                {t('For any technical support, contact: ', 'किसी भी तकनीकी सहायता के लिए संपर्क करें: ')}
                <strong className="font-semibold">8866779008</strong>
              </p>
              <p>
                {t('For other inquiries, please visit: ', 'अन्य सामान्य पूछताछ के लिए कृपया यहाँ जाएँ: ')}
                <a href="https://promanager.in/contact" className="font-medium underline hover:text-indigo-900" target="_blank" rel="noopener noreferrer">https://promanager.in/contact</a>
              </p>
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
          <h2 className="text-2xl font-bold text-gray-800">{t('Dashboard Overview', 'डैशबोर्ड अवलोकन')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'The dashboard gives you a quick snapshot of the most important metrics and daily activities happening across your organization.',
              'डैशबोर्ड आपको आपकी संस्था में हो रही दैनिक गतिविधियों और सबसे महत्वपूर्ण मेट्रिक्स की एक त्वरित झलक देता है।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Admin / Manager Dashboard', 'एडमिन / मैनेजर डैशबोर्ड')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Here you can see a quick summary of total employees, present staff, and today\'s leaves. The graphs below show payroll trends and other statistics.',
                'यहाँ आप कुल कर्मचारियों, उपस्थित कर्मचारियों और आज की छुट्टियों का संक्षिप्त विवरण देख सकते हैं। नीचे दिए गए ग्राफ़ पेरोल रुझान और अन्य आंकड़े दिखाते हैं।'
              )}
            </p>
            <img src="/document%20image/dashboard%201.png" alt="Dashboard 1" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Analytics & Employee Data', 'एनालिटिक्स और कर्मचारी डेटा')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'The second section of the dashboard tracks recent activities, pending approvals, and employee performance metrics, facilitating quick decision-making.',
                'डैशबोर्ड का दूसरा खंड हाल की गतिविधियों, लंबित स्वीकृतियों और कर्मचारी प्रदर्शन मेट्रिक्स को ट्रैक करता है, जिससे त्वरित निर्णय लेने में मदद मिलती है।'
              )}
            </p>
            <img src="/document%20image/dashboard%202.png" alt="Dashboard 2" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>
        </div>
      )
    },
    {
      id: 'employees',
      title: t('Employee Management', 'कर्मचारी प्रबंधन'),
      icon: <Users size={18} />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('Employee Management', 'कर्मचारी प्रबंधन')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'The core of Promanager is its robust employee database. Here you can manage all aspects of your workforce\'s organizational structure.',
              'प्रोमैनेजर का मुख्य हिस्सा इसका मजबूत कर्मचारी डेटाबेस है। यहाँ आप अपने कार्यबल के संगठनात्मक ढांचे के सभी पहलुओं का प्रबंधन कर सकते हैं।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Employee List', 'कर्मचारी सूची')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'On this page, you can view the list of all employees. Searching, filtering, and viewing employee profiles is very easy from here.',
                'इस पृष्ठ पर, आप सभी कर्मचारियों की सूची देख सकते हैं। यहाँ से कर्मचारियों को खोजना, फ़िल्टर करना और उनकी प्रोफ़ाइल देखना बहुत आसान है।'
              )}
            </p>
            <img src="/document%20image/emp%20list.png" alt="Employee List" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Add Employee', 'कर्मचारी जोड़ें')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Use this feature to onboard new employees into the system. It provides facilities for adding basic details, job roles, and uploading documents.',
                'सिस्टम में नए कर्मचारियों को जोड़ने के लिए इस सुविधा का उपयोग करें। यह मूल विवरण, नौकरी की भूमिकाएं और दस्तावेज़ अपलोड करने की सुविधा प्रदान करता है।'
              )}
            </p>
            <img src="/document%20image/add%20Emp.png" alt="Add Employee" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">3. {t('Branch Management', 'शाखा प्रबंधन')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Manage different branches of the company here. You can add a new branch and update the details of existing branches.',
                'यहाँ कंपनी की विभिन्न शाखाओं का प्रबंधन करें। आप एक नई शाखा जोड़ सकते हैं और मौजूदा शाखाओं का विवरण अपडेट कर सकते हैं।'
              )}
            </p>
            <img src="/document%20image/branch.png" alt="Branch" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">4. {t('Department Management', 'विभाग प्रबंधन')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Categorize and organize all departments of your organization. This helps in team reporting and filtering attendance.',
                'अपने संगठन के सभी विभागों को वर्गीकृत और व्यवस्थित करें। इससे टीम रिपोर्टिंग और उपस्थिति फ़िल्टर करने में मदद मिलती है।'
              )}
            </p>
            <img src="/document%20image/department.png" alt="Department" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">5. {t('Deduction', 'कटौती')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Set salary deduction rules and categories here. These rules are automatically applied during payroll processing.',
                'यहाँ वेतन कटौती के नियम और श्रेणियाँ निर्धारित करें। ये नियम पेरोल प्रसंस्करण के दौरान स्वचालित रूप से लागू होते हैं।'
              )}
            </p>
            <img src="/document%20image/deduction.png" alt="Deduction" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">6. {t('Increment', 'वेतन वृद्धि')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Track salary increments and promotions of employees. You can easily manage historical data and new increments from here.',
                'कर्मचारियों की वेतन वृद्धि और पदोन्नति को ट्रैक करें। आप यहाँ से आसानी से ऐतिहासिक डेटा और नई वृद्धि का प्रबंधन कर सकते हैं।'
              )}
            </p>
            <img src="/document%20image/increment.png" alt="Increment" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800">7. {t('Paid Leave', 'सवेतन अवकाश')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Use this section to check paid leave settings and balances. This makes it easier to keep track of employee leaves.',
                'सवेतन अवकाश की सेटिंग और शेष राशि की जांच करने के लिए इस अनुभाग का उपयोग करें। इससे कर्मचारियों की छुट्टियों पर नज़र रखना आसान हो जाता है।'
              )}
            </p>
            <img src="/document%20image/pain%20leave.png" alt="Paid Leave" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

        </div>
      )
    },
    {
      id: 'attendance',
      title: t('Attendance Management', 'उपस्थिति प्रबंधन'),
      icon: <Clock size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('Attendance Management', 'उपस्थिति प्रबंधन')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'Track when and where your employees are working to ensure accurate payroll and productivity tracking.',
              'सटीक पेरोल और उत्पादकता ट्रैकिंग सुनिश्चित करने के लिए ट्रैक करें कि आपके कर्मचारी कब और कहाँ काम कर रहे हैं।'
            )}
          </p>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Daily Attendance', 'दैनिक उपस्थिति')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'On the Daily Attendance page, you can view today\'s (current day) attendance and details of all employees at a glance. It provides a quick overview of how many employees are Present, Absent, Late, or on a Week Off.',
                'दैनिक उपस्थिति पृष्ठ पर, आप एक नज़र में आज की (वर्तमान दिन) उपस्थिति और सभी कर्मचारियों का विवरण देख सकते हैं। यह एक त्वरित अवलोकन प्रदान करता है कि कितने कर्मचारी उपस्थित, अनुपस्थित, देर से, या सप्ताह की छुट्टी पर हैं।'
              )}
            </p>
            <img src="/document%20image/daily_attendance.png" alt="Daily Attendance View" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-8 pb-4">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Monthly Attendance', 'मासिक उपस्थिति')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'The Monthly Attendance page summarizes the attendance record for the entire month in one place, featuring a color-coded calendar view (e.g., Green = Present, Red = Absent).',
                'मासिक उपस्थिति पृष्ठ पूरे महीने के उपस्थिति रिकॉर्ड को एक स्थान पर सारांशित करता है, जिसमें रंग-कोडित कैलेंडर दृश्य (जैसे, हरा = उपस्थित, लाल = अनुपस्थित) शामिल है।'
              )}
            </p>
            <img src="/document%20image/monthly_attendance.png" alt="Monthly Attendance View" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>
        </div>
      )
    },
    {
      id: 'shifts',
      title: t('Shift Management', 'शिफ्ट प्रबंधन'),
      icon: <Clock size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('Shift Management', 'शिफ्ट प्रबंधन')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'Create custom shift timings, assign them to different employees or departments, and manage temporary shift reallocations.',
              'कस्टम शिफ्ट समय बनाएं, उन्हें विभिन्न कर्मचारियों या विभागों को सौंपें, और अस्थायी शिफ्ट पुनर्वितरण का प्रबंधन करें।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Shifts Overview', 'शिफ्ट अवलोकन')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Information about all shifts in the system can be viewed here. You can manage existing shifts and plan schedules for new shifts.',
                'सिस्टम में मौजूद सभी शिफ्ट्स की जानकारी यहाँ देखी जा सकती है। आप मौजूदा शिफ्ट्स का प्रबंधन कर सकते हैं और नई शिफ्ट्स के लिए कार्यक्रम की योजना बना सकते हैं।'
              )}
            </p>
            <img src="/document%20image/shifts.png" alt="Shifts Overview" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Create Shift', 'शिफ्ट बनाएँ')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Define the timing, break duration, and working days to create a new shift. This shift can then be assigned to employees.',
                'नई शिफ्ट बनाने के लिए समय, ब्रेक की अवधि और कार्य दिवसों को परिभाषित करें। इसके बाद यह शिफ्ट कर्मचारियों को सौंपी जा सकती है।'
              )}
            </p>
            <img src="/document%20image/create%20shift.png" alt="Create Shift" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800">3. {t('Assign Shift', 'शिफ्ट असाइन करें')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Assign the created shifts to specific employees or departments. You can also allocate shifts for a particular date range.',
                'बनाई गई शिफ्ट्स को विशिष्ट कर्मचारियों या विभागों को असाइन करें। आप किसी विशेष तिथि सीमा के लिए भी शिफ्ट आवंटित कर सकते हैं।'
              )}
            </p>
            <img src="/document%20image/assign%20shift.png" alt="Assign Shift" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800">4. {t('Reallocation History', 'पुनर्वितरण इतिहास')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'The entire history of any changes (reallocations) made to previously assigned shifts is tracked here to maintain transparency.',
                'पारदर्शिता बनाए रखने के लिए पहले से निर्दिष्ट शिफ्ट्स में किए गए किसी भी परिवर्तन (पुनर्वितरण) का पूरा इतिहास यहाँ ट्रैक किया जाता है।'
              )}
            </p>
            <img src="/document%20image/reallocation%20history.png" alt="Reallocation History" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-800">5. {t('Shift Selection', 'शिफ्ट चयन')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Employees or managers can easily select and update the correct shift from multiple shift options. This feature helps in flexible scheduling.',
                'कर्मचारी या प्रबंधक आसानी से कई शिफ्ट विकल्पों में से सही शिफ्ट का चयन और अद्यतन कर सकते हैं। यह सुविधा लचीले शेड्यूलिंग में मदद करती है।'
              )}
            </p>
            <img src="/document%20image/shift%20selection.png" alt="Shift Selection" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>
        </div>
      )
    },
    {
      id: 'leaves',
      title: t('Leaves & Holidays', 'छुट्टियाँ और अवकाश'),
      icon: <Calendar size={18} />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('Leaves & Holidays', 'छुट्टियाँ और अवकाश')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'Manage time off effectively with integrated leave policies and holiday calendars.',
              'एकीकृत अवकाश नीतियों और हॉलिडे कैलेंडर के साथ समय का प्रभावी ढंग से प्रबंधन करें।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Leave List', 'अवकाश सूची')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'All employee leave requests are tracked here. Managers can approve or reject the applied leaves from this section.',
                'सभी कर्मचारी अवकाश अनुरोधों को यहाँ ट्रैक किया जाता है। प्रबंधक इस अनुभाग से लागू छुट्टियों को स्वीकृत या अस्वीकृत कर सकते हैं।'
              )}
            </p>
            <img src="/document%20image/Leave%20list.png" alt="Leave List" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Leave Add', 'अवकाश जोड़ें')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Employees or admins can apply for a new leave from here, mentioning the reason and date for the leave.',
                'कर्मचारी या एडमिन छुट्टी का कारण और तारीख बताते हुए यहाँ से नई छुट्टी के लिए आवेदन कर सकते हैं।'
              )}
            </p>
            <img src="/document%20image/leave%20add.png" alt="Leave Add" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">3. {t('Holiday List', 'हॉलिडे सूची')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A list of all public and official company holidays is displayed here, which automatically adjusts payroll and attendance calculations.',
                'सभी सार्वजनिक और आधिकारिक कंपनी की छुट्टियों की एक सूची यहाँ प्रदर्शित की जाती है, जो स्वचालित रूप से पेरोल और उपस्थिति गणनाओं को समायोजित करती है।'
              )}
            </p>
            <img src="/document%20image/Holiday%20list.png" alt="Holiday List" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-800">4. {t('Holiday Add', 'हॉलिडे जोड़ें')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'This feature is used to add new holidays (such as festivals or national holidays) to the system.',
                'इस सुविधा का उपयोग सिस्टम में नई छुट्टियां (जैसे त्यौहार या राष्ट्रीय अवकाश) जोड़ने के लिए किया जाता है।'
              )}
            </p>
            <img src="/document%20image/holiday%20add.png" alt="Holiday Add" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>
        </div>
      )
    },
    {
      id: 'payroll',
      title: t('Payroll & Salary', 'पेरोल और वेतन'),
      icon: <IndianRupee size={18} />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('Payroll Processing', 'पेरोल प्रोसेसिंग')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'Automate your salary calculations based on attendance, leaves, allowances, and deductions.',
              'उपस्थिति, छुट्टियों, भत्तों और कटौतियों के आधार पर अपने वेतन गणना को स्वचालित करें।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Employee Salary', 'कर्मचारी वेतन')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A detailed view of each employee\'s fixed salary, allowances, and deductions can be seen here. This data is used for base pay calculation.',
                'प्रत्येक कर्मचारी के निश्चित वेतन, भत्तों और कटौतियों का विस्तृत दृश्य यहाँ देखा जा सकता है। इस डेटा का उपयोग मूल वेतन गणना के लिए किया जाता है।'
              )}
            </p>
            <img src="/document%20image/salary%20emp.png" alt="Employee Salary" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Employee Payroll', 'कर्मचारी पेरोल')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'The final employee payroll generated based on attendance and leaves is verified here. After this, the payslip is finalized and distributed.',
                'उपस्थिति और छुट्टियों के आधार पर उत्पन्न अंतिम कर्मचारी पेरोल को यहाँ सत्यापित किया जाता है। इसके बाद, पेस्लिप को अंतिम रूप दिया जाता है और वितरित किया जाता है।'
              )}
            </p>
            <img src="/document%20image/payroll%20emp.png" alt="Employee Payroll" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
            <h3 className="text-green-800 font-semibold mb-2">{t('One-Click Payroll', 'वन-क्लिक पेरोल')}</h3>
            <p className="text-green-700 text-sm">
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
          <h2 className="text-2xl font-bold text-gray-800">{t('Reports & Analytics', 'रिपोर्ट्स और एनालिटिक्स')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'Generate detailed, exportable reports to gain insights into your organization\'s operations.',
              'अपने संगठन के संचालन में अंतर्दृष्टि प्राप्त करने के लिए विस्तृत, निर्यात योग्य रिपोर्ट तैयार करें।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('Employee Directory Report', 'कर्मचारी निर्देशिका रिपोर्ट')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A detailed list of all employees\' basic information and their assigned roles/departments can be viewed and exported here.',
                'सभी कर्मचारियों की बुनियादी जानकारी और उनके निर्दिष्ट भूमिकाओं/विभागों की एक विस्तृत सूची यहाँ देखी और निर्यात की जा सकती है।'
              )}
            </p>
            <img src="/document%20image/R1%20employee_directory_clean.png" alt="Employee Directory" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Daily Attendance Report', 'दैनिक उपस्थिति रिपोर्ट')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A quick summary report of all punch-ins and punch-outs for the day is generated here.',
                'दिन भर के सभी पंच-इन और पंच-आउट की एक त्वरित सारांश रिपोर्ट यहाँ तैयार की जाती है।'
              )}
            </p>
            <img src="/document%20image/R2%20daily_attendance_report_clean.png" alt="Daily Attendance Report" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">3. {t('Daily Attendance Details', 'दैनिक उपस्थिति विवरण')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Check the detailed view of attendance for any given day, including late arrivals or early departures.',
                'किसी भी दिन के लिए उपस्थिति का विस्तृत दृश्य देखें, जिसमें देर से आना या जल्दी जाना शामिल है।'
              )}
            </p>
            <img src="/document%20image/R3%20daily_attendance_details_clean.png" alt="Daily Attendance Details" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">4. {t('Geolocation Timeline', 'जियोलोकेशन टाइमलाइन')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'The punch-in locations and timelines of field staff or remote workers can be traced here using a map.',
                'फ़ील्ड कर्मचारियों या दूरस्थ श्रमिकों के पंच-इन स्थानों और समयसीमाओं का यहाँ मानचित्र का उपयोग करके पता लगाया जा सकता है।'
              )}
            </p>
            <img src="/document%20image/R4%20geolocation_timeline_clean.png" alt="Geolocation Timeline" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">5. {t('Attendance Exception', 'उपस्थिति अपवाद')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'An exception report highlighting missing punches, continuous absentees, or other attendance anomalies can be found here.',
                'गायब पंच, लगातार अनुपस्थिति, या अन्य उपस्थिति विसंगतियों को उजागर करने वाली एक अपवाद रिपोर्ट यहाँ पाई जा सकती है।'
              )}
            </p>
            <img src="/document%20image/R5%20att%20exception.png" alt="Attendance Exception" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">6. {t('Additional Analytics', 'अतिरिक्त एनालिटिक्स')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Use this section for other detailed system reports and specific data analysis.',
                'अन्य विस्तृत सिस्टम रिपोर्ट और विशिष्ट डेटा विश्लेषण के लिए इस अनुभाग का उपयोग करें।'
              )}
            </p>
            <img src="/document%20image/R6.png" alt="Additional Analytics" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">7. {t('Monthly Attendance Report', 'मासिक उपस्थिति रिपोर्ट')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Get a detailed summary of attendance for the whole month from here, which includes the present, absent, and late marks of every employee.',
                'पूरे महीने की उपस्थिति का विस्तृत सारांश यहाँ से प्राप्त करें, जिसमें प्रत्येक कर्मचारी के उपस्थित, अनुपस्थित और देर से आने के निशान शामिल हैं।'
              )}
            </p>
            <img src="/document%20image/R7.png" alt="Monthly Attendance Report" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">8. {t('Muster Roll', 'मस्टर रोल')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A comprehensive attendance view for the entire month, which is essential for payroll and compliance requirements, can be viewed here.',
                'पूरे महीने के लिए एक व्यापक उपस्थिति दृश्य, जो पेरोल और अनुपालन आवश्यकताओं के लिए आवश्यक है, यहाँ देखा जा सकता है।'
              )}
            </p>
            <img src="/document%20image/R8.webp" alt="Muster Roll" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">9. {t('Salary Report', 'वेतन रिपोर्ट')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A detailed breakdown of generated salary, deductions, and allowances for all employees is included in this report.',
                'सभी कर्मचारियों के लिए उत्पन्न वेतन, कटौती और भत्तों का विस्तृत विवरण इस रिपोर्ट में शामिल है।'
              )}
            </p>
            <img src="/document%20image/R9.png" alt="Salary Report" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">10. {t('Paid Salary Report', 'भुगतान वेतन रिपोर्ट')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Check here to track the status and payment details of employees who have already been paid their salary.',
                'जिन कर्मचारियों को पहले ही वेतन का भुगतान किया जा चुका है, उनकी स्थिति और भुगतान विवरण ट्रैक करने के लिए यहाँ देखें।'
              )}
            </p>
            <img src="/document%20image/R10.png" alt="Paid Salary Report" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-800">11. {t('Salary Generation Status', 'वेतन जनरेशन स्थिति')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'A real-time view of the current status of salary processing and how many employees are yet to have their salary generated is available here.',
                'वेतन प्रसंस्करण की वर्तमान स्थिति का रीयल-टाइम दृश्य और कितने कर्मचारियों का वेतन अभी भी उत्पन्न होना बाकी है, यह यहाँ उपलब्ध है।'
              )}
            </p>
            <img src="/document%20image/R11.png" alt="Salary Generation Status" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>
        </div>
      )
    },
    {
      id: 'users',
      title: t('User Management', 'उपयोगकर्ता प्रबंधन'),
      icon: <Shield size={18} />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('User Management & Security', 'उपयोगकर्ता प्रबंधन और सुरक्षा')}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t(
              'Control who has access to the Promanager system and what they can do.',
              'नियंत्रित करें कि प्रोमैनेजर सिस्टम तक किसकी पहुंच है और वे क्या कर सकते हैं।'
            )}
          </p>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">1. {t('User List', 'उपयोगकर्ता सूची')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'View the list of all registered users present in the system here. You can manage existing users and control their access from here.',
                'सिस्टम में मौजूद सभी पंजीकृत उपयोगकर्ताओं की सूची यहाँ देखें। आप यहाँ से मौजूदा उपयोगकर्ताओं का प्रबंधन और उनकी पहुँच को नियंत्रित कर सकते हैं।'
              )}
            </p>
            <img src="/document%20image/user%20list.png" alt="User List" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">2. {t('Create User', 'उपयोगकर्ता बनाएँ')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Create user accounts for new administrative staff or managers from here and provide them with system access.',
                'यहाँ से नए प्रशासनिक कर्मचारियों या प्रबंधकों के लिए उपयोगकर्ता खाते बनाएँ और उन्हें सिस्टम पहुँच प्रदान करें।'
              )}
            </p>
            <img src="/document%20image/create%20user.png" alt="Create User" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 border-b pb-6">
            <h3 className="text-xl font-bold text-gray-800">3. {t('Role List', 'रोल सूची')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'All existing roles (such as HR Admin, Branch Manager) and their assigned permissions can be checked from here.',
                'सभी मौजूदा भूमिकाओं (जैसे HR एडमिन, ब्रांच मैनेजर) और उनके निर्दिष्ट अधिकारों की जाँच यहाँ से की जा सकती है।'
              )}
            </p>
            <img src="/document%20image/role%20list.png" alt="Role List" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>

          <div className="mt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-800">4. {t('Create Role', 'रोल बनाएँ')}</h3>
            <p className="text-gray-600 mt-2">
              {t(
                'Create custom roles and assign granular permissions to view, edit, or delete specific data.',
                'कस्टम भूमिकाएँ बनाएँ और विशिष्ट डेटा को देखने, संपादित करने, या हटाने के लिए अधिकार निर्दिष्ट करें।'
              )}
            </p>
            <img src="/document%20image/create%20role.png" alt="Create Role" className="w-full mt-4 rounded-lg shadow-sm border border-gray-200" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            {t('Documentation', 'दस्तावेज़ीकरण')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{t('Project overview & guides', 'प्रोजेक्ट अवलोकन और मार्गदर्शिकाएँ')}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <span className={activeSection === section.id ? 'text-indigo-600' : 'text-gray-400'}>
                  {section.icon}
                </span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto bg-gray-50 p-8 relative">
        {/* Language Toggle */}
        <div className="absolute top-8 right-8 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
          <Languages size={18} className="text-gray-500" />
          <button 
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            English
          </button>
          <button 
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'hi' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            हिंदी
          </button>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[80vh] mt-12">
          {sections.find(s => s.id === activeSection)?.content}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
