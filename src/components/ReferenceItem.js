//src/components/ReferenceItem.js
import React, { useState, useRef } from "react";
import ImageUpload from "./ImageUpload";
import { ICON_SVG } from "../utils/icons";
import { getOptimizedImageUrl } from "../utils/imageUtils";
import { parseSpotContent, assembleSpotContent, SPOT_SUB_TABS } from "../utils/referenceUtils";

const ReferenceItem = ({ refData, theme, onDelete, onUpdate, onView, dragHandleProps }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(refData);
  const [editSections, setEditSections] = useState(parseSpotContent(refData.description));
  const [activeEditTab, setActiveEditTab] = useState('info');
  const editTextareaRef = useRef(null);

  // --- 工具列邏輯 ---
  const handleToolbarClick = (tagType) => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;

    const isSpot = refData.type === 'spot';
    const currentText = isSpot ? (editSections[activeEditTab] || "") : (editData.description || "");
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let prefix = "";
    let suffix = "";
    switch (tagType) {
      case 'bold': prefix = "**"; suffix = "**"; break;
      case 'title': prefix = "# "; break;
      case 'list': prefix = "- "; break;
      case 'hr': prefix = "\n---\n"; break;
      default: break;
    }

    const selectedText = currentText.substring(start, end) || "內容";
    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const newText = before + prefix + selectedText + suffix + after;

    if (isSpot) {
      setEditSections({ ...editSections, [activeEditTab]: newText });
    } else {
      setEditData({ ...editData, description: newText });
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleSave = () => {
    const finalDesc = refData.type === 'spot' ? assembleSpotContent(editSections) : editData.description;
    onUpdate(refData.id, { ...editData, description: finalDesc });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 space-y-4 bg-slate-50 border-2 border-slate-300 rounded-xl">
        <div className="flex justify-between items-center border-b pb-2">
           <span className="text-xs font-bold text-slate-500">編輯模式</span>
           <div className="flex gap-2">
             <button onClick={() => setIsEditing(false)} className="px-2 py-1 bg-gray-200 rounded text-xs">取消</button>
             <button onClick={handleSave} className={`px-2 py-1 text-white rounded text-xs ${theme.buttonPrimary}`}>儲存</button>
           </div>
        </div>
        <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full p-2 border rounded text-sm font-bold" />
        <ImageUpload currentImage={editData.imageUrl} onUploadSuccess={url => setEditData({...editData, imageUrl: url})} />
        {refData.type === 'spot' ? (
          <div>
             <div className="flex space-x-1 overflow-x-auto">
               {SPOT_SUB_TABS.map(t => <button key={t.id} onClick={() => setActiveEditTab(t.id)} className={`px-2 py-1 text-[10px] ${activeEditTab === t.id ? 'bg-white border' : 'text-gray-400'}`}>{t.name}</button>)}
             </div>
             <textarea ref={editTextareaRef} value={editSections[activeEditTab]} onChange={e => setEditSections({...editSections, [activeEditTab]: e.target.value})} rows="6" className="w-full border p-2 text-sm" />
          </div>
        ) : (
          <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows="6" className="w-full border p-2 text-sm" />
        )}
      </div>
    );
  }

  // 渲染邏輯 (這部分與原本的 Transport/Spot/Guide Layout 相同)
  return (
    <div className="relative bg-white border border-gray-100 rounded-xl overflow-hidden group">
      <div {...dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab">
        <ICON_SVG.menu className="w-5 h-5" />
      </div>

      {refData.type === 'transport' ? (
        <div className="flex flex-col pl-10 pr-4 py-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-700">{refData.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-slate-500"><ICON_SVG.pencil className="w-4 h-4" /></button>
              <button onClick={() => onDelete(refData.id)} className="text-gray-300 hover:text-red-400"><ICON_SVG.trash className="w-4 h-4" /></button>
            </div>
          </div>
          {refData.description && <div className="text-sm text-gray-600 bg-slate-50 p-3 rounded-lg mb-3">{refData.description}</div>}
          {refData.imageUrl && <img src={getOptimizedImageUrl(refData.imageUrl, 2000)} className="w-full rounded-lg" onClick={() => window.open(refData.imageUrl)} />}
        </div>
      ) : refData.type === 'spot' ? (
        <div className="flex flex-col h-full pl-2">
          <img src={getOptimizedImageUrl(refData.imageUrl, 800)} className="aspect-video object-cover cursor-pointer" onClick={() => onView(refData)} />
          <div className="p-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-lg truncate">{refData.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)}><ICON_SVG.pencil className="w-4 h-4 text-gray-300" /></button>
                <button onClick={() => onDelete(refData.id)}><ICON_SVG.trash className="w-4 h-4 text-gray-300" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{parseSpotContent(refData.description).info}</p>
            <button onClick={() => onView(refData)} className={`w-full py-2 rounded-lg text-xs font-bold border ${theme.accentText} ${theme.accentBorder}`}>完整詳情</button>
          </div>
        </div>
      ) : (
        <div className="flex p-3 gap-3 pl-10">
          {refData.imageUrl && <img src={getOptimizedImageUrl(refData.imageUrl, 800)} className="w-20 h-20 rounded-lg object-cover" />}
          <div className="flex-grow min-w-0">
             <div className="flex justify-between items-center">
               <h3 className="font-bold text-base truncate">{refData.title}</h3>
               <div className="flex gap-2">
                 <button onClick={() => setIsEditing(true)}><ICON_SVG.pencil className="w-3.5 h-3.5 text-gray-300" /></button>
                 <button onClick={() => onDelete(refData.id)}><ICON_SVG.trash className="w-3.5 h-3.5 text-gray-300" /></button>
               </div>
             </div>
             <p className="text-xs text-gray-400 line-clamp-2">{refData.description}</p>
             {refData.url && <a href={refData.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-bold underline">開啟連結</a>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceItem;