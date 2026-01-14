// src/components/ReferenceItem.js
import React, { useState, useRef } from "react";
import ImageUpload from "./ImageUpload";
import { ICON_SVG } from "../utils/icons";
import { getOptimizedImageUrl } from "../utils/imageUtils";
import { parseSpotContent, assembleSpotContent, SPOT_SUB_TABS } from "../utils/referenceUtils";

const ImageSlider = ({ urls, onView }) => {
  const [index, setIndex] = useState(0);
  if (!urls || urls.length === 0) return null;

  const next = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % urls.length);
  };
  const prev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  return (
    <div className="relative group w-full h-full">
      <img 
        src={getOptimizedImageUrl(urls[index], 800)} 
        className="w-full h-full object-cover cursor-pointer" 
        onClick={() => onView && onView()} 
      />
      {urls.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
            <ICON_SVG.arrowLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
            <div className="rotate-180"><ICON_SVG.arrowLeft className="w-5 h-5" /></div>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            {index + 1} / {urls.length}
          </div>
        </>
      )}
    </div>
  );
};

const ReferenceItem = ({ refData, theme, onDelete, onUpdate, onView, dragHandleProps, totalDays }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(refData);
  const [editSections, setEditSections] = useState(parseSpotContent(refData.description));
  const [activeEditTab, setActiveEditTab] = useState('info');
  const editTextareaRef = useRef(null);
  const [imgIndex, setImgIndex] = useState(0);

  // 處理圖片相容性 (將單一字串或陣列統一轉成陣列) 
  const images = Array.isArray(refData.imageUrl) 
    ? refData.imageUrl 
    : (refData.imageUrl ? [refData.imageUrl] : []);

  // --- 工具列與儲存邏輯 ---
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
    onUpdate(refData.id, { ...editData, description: finalDesc, imageUrl: editData.imageUrl });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 space-y-4 bg-slate-50 border-2 border-slate-300 rounded-xl animate-fade-in">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
          <span className="text-sm font-bold text-slate-700 italic">模式：詳細編輯</span>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold transition">取消</button>
            <button onClick={handleSave} className={`px-3 py-1 text-white rounded text-xs font-bold shadow-sm ${theme.buttonPrimary}`}>儲存</button>
          </div>
        </div>

        <div className="space-y-3">
          {/* 天數選擇 (僅限交通類型) */}
          {refData.type === 'transport' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 ml-1">關聯日期</label>
              <select 
                value={editData.day || 1}
                onChange={e => setEditData({...editData, day: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white"
              >
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
            </div>
          )}

          <label className="block text-[10px] font-bold text-gray-400 ml-1">地點/項目名稱</label>
          <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none" />
          {/* 修改連結欄位 */}
          <label className="block text-[10px] font-bold text-gray-400 ml-1">相關連結 (URL)</label>
          <input 
            type="url" 
            value={editData.url || ""} 
            onChange={e => setEditData({...editData, url: e.target.value})} 
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-200 outline-none" 
          />
          <label className="block text-[10px] font-bold text-gray-400 ml-1">封面圖片</label>
          <ImageUpload 
           currentImages={Array.isArray(editData.imageUrl) ? editData.imageUrl : (editData.imageUrl ? [editData.imageUrl] : [])} 
           onUploadSuccess={urls => setEditData({...editData, imageUrl: urls})}
          />
        </div>

        {refData.type === 'spot' ? (
          <div className="mt-4">
            {/* 點編輯分頁，強制不換行並允許橫向捲動 */}
            <div className="flex flex-nowrap space-x-1 overflow-x-auto pb-1 scrollbar-hide">
              {SPOT_SUB_TABS.map(tab => (
                <button 
                  key={tab.id} 
                  type="button" 
                  onClick={() => setActiveEditTab(tab.id)} 
                  className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-t-lg text-[11px] font-bold transition-all ${
                    activeEditTab === tab.id 
                      ? 'bg-white border-t border-l border-r border-gray-300 text-slate-700' 
                      : 'text-gray-400 hover:text-slate-500'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="bg-white p-3 border border-gray-300 rounded-b-lg rounded-tr-lg shadow-inner">
              <div className="flex space-x-2 mb-2 px-1">
                <button onClick={() => handleToolbarClick('title')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">標題</button>
                <button onClick={() => handleToolbarClick('bold')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">粗體</button>
                <button onClick={() => handleToolbarClick('list')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">清單</button>
                <button onClick={() => handleToolbarClick('hr')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">分隔線</button>
              </div>
              <textarea 
                ref={editTextareaRef} 
                value={editSections[activeEditTab] || ''} 
                onChange={(e) => setEditSections({ ...editSections, [activeEditTab]: e.target.value })} 
                rows="10" 
                className="w-full px-3 py-2 border-none text-sm focus:ring-0 outline-none leading-relaxed text-slate-600" 
              />
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex space-x-2 mb-2 px-1">
              <button onClick={() => handleToolbarClick('title')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">標題</button>
              <button onClick={() => handleToolbarClick('bold')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">粗體</button>
              <button onClick={() => handleToolbarClick('list')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">清單</button>
              <button onClick={() => handleToolbarClick('hr')} className="p-1.5 bg-gray-200 rounded text-[10px] font-bold">分隔線</button>
            </div>
            <textarea ref={editTextareaRef} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows="10" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm leading-relaxed shadow-inner outline-none focus:ring-1 focus:ring-slate-300" />
          </div>
        )}
      </div>
    );
  }

  // --- 顯示模式 ---
  return (
    <div className="relative bg-white border border-gray-100 rounded-xl overflow-hidden group hover:shadow-md transition">
      <div {...dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing">
        <ICON_SVG.menu className="w-5 h-5" />
      </div>

      {refData.type === 'transport' ? (
        <div className="flex flex-col pl-10 pr-4 py-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-700 leading-tight">{refData.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-slate-500 transition"><ICON_SVG.pencil className="w-4 h-4" /></button>
              <button onClick={() => onDelete(refData.id)} className="text-gray-300 hover:text-red-400 transition"><ICON_SVG.trash className="w-4 h-4" /></button>
            </div>
          </div>
          {refData.description && <div className="text-sm text-gray-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 leading-relaxed">{refData.description}</div>}
          {/* 交通模式使用 Slider */}
          <div className="w-full mb-3">
             <ImageSlider urls={images} onView={() => window.open(images[0])} />
          </div>
          {refData.url && <a href={refData.url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition"><ICON_SVG.link className="w-4 h-4 mr-2" /> 路線連結</a>}
        </div>
      ) : refData.type === 'spot' ? (
        <div className="flex flex-col h-full pl-2">
          {/* 景點模式使用 Slider */}
          <div className="aspect-video w-full overflow-hidden bg-gray-100">
             <ImageSlider urls={images} onView={() => onView(refData)} />
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg leading-tight pr-2">{refData.title}</h3>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-slate-500"><ICON_SVG.pencil className="w-4 h-4" /></button>
                <button onClick={() => onDelete(refData.id)} className="text-gray-300 hover:text-red-400"><ICON_SVG.trash className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="text-sm text-gray-500 line-clamp-2 mb-4">{parseSpotContent(refData.description).info || "暫無介紹..."}</div>
            <button onClick={() => onView(refData)} className={`mt-auto w-full py-2 rounded-lg text-xs font-bold border transition ${theme.accentText} ${theme.accentBorder} hover:bg-slate-50`}>查看完整內容</button>
          </div>
        </div>
      ) : (
        <div className="flex p-3 gap-3 pl-10">
          {refData.imageUrl && <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-100"><img src={getOptimizedImageUrl(refData.imageUrl, 800)} className="w-full h-full object-cover" alt="" /></div>}
          <div className="flex-grow min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base truncate pr-2">{refData.title}</h3>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setIsEditing(true)} className="text-gray-300"><ICON_SVG.pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(refData.id)} className="text-gray-300"><ICON_SVG.trash className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{refData.description}</p>
            {refData.url && <a href={refData.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 mt-1 flex items-center font-bold hover:underline"><ICON_SVG.link className="w-3 h-3 mr-1" /> 開啟連結</a>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceItem;