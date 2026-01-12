//src/components/ReferenceAddForm.js
import React, { useState, useRef } from "react";
import ImageUpload from "./ImageUpload";
import { ICON_SVG } from "../utils/icons";
import { SPOT_SUB_TABS, assembleSpotContent } from "../utils/referenceUtils";

const ReferenceAddForm = ({ activeTab, onAdd, theme, totalDays }) => {
  const [isFetching, setIsFetching] = useState(false);
  const addTextareaRef = useRef(null);
  const [activeAddSubTab, setActiveAddSubTab] = useState('info');
  const [newSections, setNewSections] = useState({ info: '', food: '', shop: '', nearby: '', note: '' });
  const [newData, setNewData] = useState({ 
    title: "", 
    url: "", 
    imageUrl: "", 
    description: "", 
    day: 1 // 預設第一天
  });

  const fetchMetadata = async (targetUrl) => {
    if (!targetUrl.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
      const result = await response.json();
      if (result.status === "success") {
        setNewData(prev => ({
          ...prev,
          title: result.data.title || "",
          imageUrl: result.data.image?.url || result.data.logo?.url || "",
          description: result.data.description || "",
        }));
      }
    } catch (e) { console.error(e); } finally { setIsFetching(false); }
  };

  // 工具列定義
  const TOOLBAR_ITEMS = [
    { id: 'title', name: '標題' },
    { id: 'bold', name: '粗體' },
    { id: 'list', name: '清單' },
    { id: 'hr', name: '分隔線' }
  ];

  const handleToolbarClick = (tagType) => {
    const textarea = addTextareaRef.current;
    if (!textarea) return;
    const currentText = newSections[activeAddSubTab] || "";
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let prefix = tagType === 'bold' ? '**' : tagType === 'title' ? '# ' : tagType === 'list' ? '- ' : '\n---\n';
    let suffix = tagType === 'bold' ? '**' : '';
    const selectedText = currentText.substring(start, end) || "內容";
    const newText = currentText.substring(0, start) + prefix + selectedText + suffix + currentText.substring(end);
    setNewSections({ ...newSections, [activeAddSubTab]: newText });
  };

  const handleSubmit = () => {
    const finalDesc = activeTab === 'spot' ? assembleSpotContent(newSections) : newData.description;
    onAdd({ ...newData, description: finalDesc, type: activeTab });
  };

  return (
    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-4 animate-fade-in">
      {/* 交通分頁顯示天數選擇 */}
      {activeTab === 'transport' && (
      <div className="flex items-center space-x-2 bg-white/50 p-2 rounded-md border border-gray-200">
        <ICON_SVG.calendar className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-500">此交通建議用於：</span>
        <select 
          value={newData.day}
          onChange={e => setNewData({...newData, day: Number(e.target.value)})}
          className="text-xs border-none bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
        >
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
            <option key={d} value={d}>Day {d}</option>
          ))}
        </select>
      </div>
    )}
      {/* 網址抓取區 */}
      <div className="flex gap-2">
        <input type="text" placeholder="貼上網址 (選填)..." value={newData.url} onChange={e => setNewData({...newData, url: e.target.value})} className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm outline-none" />
        <button onClick={() => fetchMetadata(newData.url)} disabled={isFetching} className="shrink-0 px-3 py-2 bg-white border rounded text-xs font-bold shadow-sm">{isFetching ? "..." : "抓取"}</button>
      </div>

      {/* 標題輸入框 */}
      <input type="text" placeholder="標題 *" value={newData.title} onChange={e => setNewData({...newData, title: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm outline-none" />
      <ImageUpload currentImage={newData.imageUrl} onUploadSuccess={url => setNewData({...newData, imageUrl: url})} />

      {activeTab === 'spot' ? (
        <div className="mt-4">
          {/* 景點新增分頁，強制不換行並允許橫向捲動 */}
          <div className="flex flex-nowrap space-x-1 overflow-x-auto pb-1 scrollbar-hide">
            {SPOT_SUB_TABS.map(tab => (
              <button 
                key={tab.id} 
                type="button"
                onClick={() => setActiveAddSubTab(tab.id)} 
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-t-lg text-[11px] font-bold transition-all ${
                  activeAddSubTab === tab.id 
                    ? 'bg-white border-t border-l border-r border-gray-300 text-slate-700' 
                    : 'text-gray-400 hover:text-slate-500'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="bg-white p-2 border border-gray-300 rounded-b-lg shadow-inner">
             {/* Markdown 標籤改為中文顯示 */}
             <div className="flex space-x-2 mb-2 px-1">
                {TOOLBAR_ITEMS.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleToolbarClick(item.id)} 
                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold text-slate-600 transition"
                  >
                    {item.name}
                  </button>
                ))}
             </div>
             <textarea 
               ref={addTextareaRef} 
               value={newSections[activeAddSubTab] || ''} 
               onChange={e => setNewSections({...newSections, [activeAddSubTab]: e.target.value})} 
               rows="8" 
               className="w-full text-sm outline-none p-2 leading-relaxed" 
               placeholder={`請輸入「${SPOT_SUB_TABS.find(t => t.id === activeAddSubTab).name}」的內容...`}
             />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 交通或攻略模式也補上中文工具列 */}
          <div className="flex space-x-2 px-1">
            {TOOLBAR_ITEMS.map(item => (
              <button key={item.id} onClick={() => handleToolbarClick(item.id)} className="px-2 py-1.5 bg-gray-200 rounded text-[10px] font-bold text-slate-600">{item.name}</button>
            ))}
          </div>
          <textarea placeholder="詳細內容..." value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} rows="8" className="w-full px-3 py-2 border rounded-md text-sm outline-none" />
        </div>
      )}
      <button onClick={handleSubmit} className={`w-full py-2.5 rounded-md text-white font-bold shadow-md transition active:scale-95 ${theme.buttonPrimary}`}>確認新增</button>
    </div>
  );
};

export default ReferenceAddForm;