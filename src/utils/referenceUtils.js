//src/utils/referenceUtils.js
export const SPOT_SUB_TABS = [
  { id: 'info', name: '介紹', icon: 'info' },
  { id: 'food', name: '美食', icon: 'food' },
  { id: 'shop', name: '特色店家', icon: 'shopping' },
  { id: 'nearby', name: '附近景點', icon: 'mapPin' },
  { id: 'note', name: '注意事項', icon: 'noteText' },
];

export const parseSpotContent = (text) => {
  const sections = { info: '', food: '', shop: '', nearby: '', note: '' };
  if (!text || typeof text !== 'string') return sections;
  const parts = text.split(/\[(美食|特色店家|附近景點|注意事項)\]/);
  sections.info = (parts[0] || '').trim();
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i];
    const content = (parts[i + 1] || '').trim();
    if (key === '美食') sections.food = content;
    else if (key === '特色店家') sections.shop = content;
    else if (key === '附近景點') sections.nearby = content;
    else if (key === '注意事項') sections.note = content;
  }
  return sections;
};

export const assembleSpotContent = (sections) => {
  let result = (sections.info || '').trim();
  if (sections.food?.trim()) result += `\n\n[美食]\n${sections.food.trim()}`;
  if (sections.shop?.trim()) result += `\n\n[特色店家]\n${sections.shop.trim()}`;
  if (sections.nearby?.trim()) result += `\n\n[附近景點]\n${sections.nearby.trim()}`;
  if (sections.note?.trim()) result += `\n\n[注意事項]\n${sections.note.trim()}`;
  return result;
};