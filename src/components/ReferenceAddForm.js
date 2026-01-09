//src/components/ReferenceAddForm.js
import React, { useState, useRef } from "react";
import ImageUpload from "./ImageUpload";
import { ICON_SVG } from "../utils/icons";
import { SPOT_SUB_TABS, assembleSpotContent } from "../utils/referenceUtils";

const ReferenceAddForm = ({ activeTab, onAdd, theme }) => {
  const [isFetching, setIsFetching] = useState(false);
  const addTextareaRef = useRef(null);
  const [activeAddSubTab, setActiveAddSubTab] = useState('info');
  const [newSections, setNewSections] = useState({ info: '', food: '', shop: '', nearby: '', note: '' });
  const [newData, setNewData] = useState({ title: "", url: "", imageUrl: "", description: "" });

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
      <div className="flex gap-2">
        <input type="text" placeholder="貼上網址 (選填)..." value={newData.url} onChange={e => setNewData({...newData, url: e.target.value})} className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm outline-none" />
        <button onClick={() => fetchMetadata(newData.url)} disabled={isFetching} className="shrink-0 px-3 py-2 bg-white border rounded text-xs font-bold shadow-sm">{isFetching ? "..." : "抓取"}</button>
      </div>
      <input type="text" placeholder="標題 *" value={newData.title} onChange={e => setNewData({...newData, title: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm outline-none" />
      <ImageUpload currentImage={newData.imageUrl} onUploadSuccess={url => setNewData({...newData, imageUrl: url})} />

      {activeTab === 'spot' ? (
        <div className="mt-4">
          <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
            {SPOT_SUB_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveAddSubTab(tab.id)} className={`px-3 py-1.5 rounded-t-lg text-[11px] font-bold ${activeAddSubTab === tab.id ? 'bg-white border-t border-l border-r border-gray-300' : 'text-gray-400'}`}>{tab.name}</button>
            ))}
          </div>
          <div className="bg-white p-2 border border-gray-300 rounded-b-lg">
             <div className="flex space-x-2 mb-2">
                {['title', 'bold', 'list', 'hr'].map(t => <button key={t} onClick={() => handleToolbarClick(t)} className="p-1 bg-gray-100 rounded text-[10px] uppercase font-bold">{t}</button>)}
             </div>
             <textarea ref={addTextareaRef} value={newSections[activeAddSubTab]} onChange={e => setNewSections({...newSections, [activeAddSubTab]: e.target.value})} rows="8" className="w-full text-sm outline-none p-1" />
          </div>
        </div>
      ) : (
        <textarea placeholder="詳細內容..." value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} rows="8" className="w-full px-3 py-2 border rounded-md text-sm" />
      )}
      <button onClick={handleSubmit} className={`w-full py-2 rounded-md text-white font-bold ${theme.buttonPrimary}`}>確認新增</button>
    </div>
  );
};

export default ReferenceAddForm;