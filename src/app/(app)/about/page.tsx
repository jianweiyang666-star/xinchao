"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { useInnertideStore, type DietPrefs, type ExercisePrefs } from "@/lib/store";

export default function AboutPage() {
  const { store, loaded, update } = useInnertideStore();
  const [dietPanelOpen, setDietPanelOpen] = useState(false);
  const [exercisePanelOpen, setExercisePanelOpen] = useState(false);

  // Local state for preferences
  const [localDiet, setLocalDiet] = useState<DietPrefs>(store.dietPreferences);
  const [localExercise, setLocalExercise] = useState<ExercisePrefs>(store.exercisePreferences);

  if (!loaded) return <div className="min-h-screen bg-void-bg" />;

  const handleOpenDiet = () => {
    setLocalDiet(store.dietPreferences);
    setDietPanelOpen(true);
  };

  const handleOpenExercise = () => {
    setLocalExercise(store.exercisePreferences);
    setExercisePanelOpen(true);
  };

  const saveDiet = () => {
    update({ dietPreferences: localDiet });
    setDietPanelOpen(false);
  };

  const saveExercise = () => {
    update({ exercisePreferences: localExercise });
    setExercisePanelOpen(false);
  };

  const updateLocalDiet = (key: keyof DietPrefs, val: any) => {
    setLocalDiet(prev => ({ ...prev, [key]: val }));
  };

  const toggleLocalDietArray = (key: 'allergies' | 'religion' | 'healthGoals' | 'avoid', val: string) => {
    const list = localDiet[key];
    const newList = list.includes(val) ? list.filter(t => t !== val) : [...list, val];
    updateLocalDiet(key, newList);
  };

  const updateLocalExercise = (key: keyof ExercisePrefs, val: any) => {
    setLocalExercise(prev => ({ ...prev, [key]: val }));
  };

  const toggleLocalExerciseArray = (key: 'conditions' | 'goals' | 'environment' | 'avoiding', val: string) => {
    const list = localExercise[key];
    const newList = list.includes(val) ? list.filter((t: string) => t !== val) : [...list, val];
    updateLocalExercise(key, newList);
  };

  return (
    <div className="relative min-h-screen animate-phase-fade bg-[#FAF6F2] text-[#4A3E3B]">
      <header className="flex items-center px-5 pt-12 pb-2">
        <Link
          href="/today"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8C7B77] transition hover:bg-[#EADCD1]/50"
          aria-label="返回"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-8 py-12 animate-ink-rise">
        <h1 className="font-serif italic text-3xl font-light tracking-[0.1em]">关于我</h1>

        {/* Name */}
        <Field label="我的名字">
          <input
            type="text"
            value={store.nickname ?? ""}
            onChange={(e) => update({ nickname: e.target.value })}
            placeholder="还没告诉我"
            className="w-full border-b border-[#DECEC1] bg-transparent py-2 text-base text-[#4A3E3B] placeholder:text-[#8C7B77] focus:outline-none"
          />
        </Field>

        {/* Last Period */}
        <Field label="上次月经第一天">
          <input
            type="date"
            value={store.lastPeriodStart?.slice(0, 10) ?? ""}
            onChange={(e) =>
              update({
                lastPeriodStart: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="w-full border-b border-[#DECEC1] bg-transparent py-2 text-base text-[#4A3E3B] focus:outline-none"
          />
        </Field>

        {/* Preferences Buttons */}
        <div className="pt-4 space-y-2">
          <button 
            onClick={handleOpenDiet}
            className="w-full flex items-center justify-between text-left border-b border-[#DECEC1] py-5 focus:outline-none"
          >
            <span className="text-[14px]">饮食偏好设置</span>
            <ChevronLeft className="h-4 w-4 rotate-180 text-[#8C7B77]" />
          </button>
          <button 
            onClick={handleOpenExercise}
            className="w-full flex items-center justify-between text-left border-b border-[#DECEC1] py-5 focus:outline-none"
          >
            <span className="text-[14px]">运动偏好设置</span>
            <ChevronLeft className="h-4 w-4 rotate-180 text-[#8C7B77]" />
          </button>
        </div>

        {/* TTS Toggle */}
        <Field label="语音陪伴">
          <button
            type="button"
            onClick={() => update({ ttsEnabled: !store.ttsEnabled })}
            className="flex items-center gap-3"
          >
            <span
              className={`relative inline-block h-6 w-11 rounded-full transition-colors ${
                store.ttsEnabled ? "bg-[#FF85A2]" : "bg-[#DECEC1]"
              }`}
            >
              <span
                className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white transition-all ${
                  store.ttsEnabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
            <span className="text-sm tracking-[0.2em] uppercase font-light opacity-60">
              {store.ttsEnabled ? "开" : "关"}
            </span>
          </button>
        </Field>
      </main>

      {/* Diet Preferences Sliding Panel */}
      <div 
        className={`fixed inset-0 z-50 bg-[#FDFBF9] text-[#4A3E3B] transition-transform duration-500 flex flex-col ${
           dietPanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="flex-none px-6 pt-12 pb-6 relative border-b border-[#DECEC1]/20">
          <button 
            onClick={() => setDietPanelOpen(false)}
            className="absolute top-12 right-6 p-2 text-[#4A3E3B] opacity-50 hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-serif text-[#4A3E3B]">饮食偏好</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            {/* 1. 硬性禁忌 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">1.</span>
                <h2 className="text-lg font-medium">硬性禁忌</h2>
                <span className="text-[10px] bg-[#FFE0E0] text-[#FF5A5A] px-2 py-0.5 rounded-full">严格</span>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">一票否决，AI 推荐会严格排除</p>
              
              <div className="space-y-4">
                <div className="text-[13px] text-[#8C7B77]">过敏原</div>
                <div className="flex flex-wrap gap-2">
                   {["花生","坚果","海鲜","鸡蛋","牛奶","麸质","大豆","芝麻"].map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.allergies.includes(tag)}
                       onClick={() => toggleLocalDietArray('allergies', tag)}
                     />
                   ))}
                   <input 
                     placeholder="其他过敏原（可填空）"
                     className="flex-1 min-w-[120px] bg-[#F4ECE6] border border-[#DECEC1] rounded-full px-4 py-2 text-[13px] focus:outline-none placeholder:text-[#8C7B77]/60"
                   />
                </div>

                <div className="text-[13px] text-[#8C7B77] pt-2">宗教民俗</div>
                <div className="flex flex-wrap gap-2">
                   {["清真","佛教素斋","忌狗肉"].map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.religion.includes(tag)}
                       onClick={() => toggleLocalDietArray('religion', tag)}
                     />
                   ))}
                   <input 
                     placeholder="其他禁忌（可填空）"
                     className="flex-1 min-w-[120px] bg-[#F4ECE6] border border-[#DECEC1] rounded-full px-4 py-2 text-[13px] focus:outline-none placeholder:text-[#8C7B77]/60"
                   />
                </div>
              </div>
            </div>

            {/* 2. 饮食模式 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">2.</span>
                <h2 className="text-lg font-medium">饮食模式</h2>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">长期习惯，只能选一种</p>
              
              <div className="flex flex-wrap gap-2">
                 {["无限制","素食（蛋奶）","素食（纯素）","生酮","低碳水","无麸质","低 FODMAP"].map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localDiet.dietMode === tag}
                     onClick={() => updateLocalDiet('dietMode', tag)}
                     radio
                   />
                 ))}
              </div>
            </div>

            {/* 3. 健康管理目标 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">3.</span>
                <h2 className="text-lg font-medium">健康管理目标</h2>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">与生理状态独立，可同时选多个</p>
              
              <div className="flex flex-wrap gap-2">
                 {["控糖","低嘌呤（痛风）","低盐（高血压）","低脂（高血脂）","养胃（反流/虚弱）","护肝","补气血","祛湿"].map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localDiet.healthGoals.includes(tag)}
                     onClick={() => toggleLocalDietArray('healthGoals', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 4. 口味与软偏好 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">4.</span>
                <h2 className="text-lg font-medium">口味与软偏好</h2>
                <span className="text-[10px] bg-[#E0F0FF] text-[#5A9BFF] px-2 py-0.5 rounded-full">软偏好</span>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">软性过滤，优先推荐但不严格排除</p>
              
              <div className="space-y-4">
                <div className="text-[13px] text-[#8C7B77]">辣度</div>
                <div className="flex flex-wrap gap-2">
                   {["不辣","微辣","中辣","重辣"].map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.spicy === tag}
                       onClick={() => updateLocalDiet('spicy', tag)} radio
                     />
                   ))}
                </div>

                <div className="text-[13px] text-[#8C7B77] pt-2">油量</div>
                <div className="flex flex-wrap gap-2">
                   {["少油","正常"].map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.oil === tag}
                       onClick={() => updateLocalDiet('oil', tag)} radio
                     />
                   ))}
                </div>

                <div className="text-[13px] text-[#8C7B77] pt-2">忌口（可多选）</div>
                <div className="flex flex-wrap gap-2">
                   {["忌辛辣","忌生冷","忌甜食","忌内脏","忌海鲜水产","忌红肉","忌腥膻","忌豆制品"].map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.avoid.includes(tag)}
                       onClick={() => toggleLocalDietArray('avoid', tag)}
                     />
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-none p-6 pt-2 pb-12 bg-white border-t border-[#DECEC1]/20">
          <div className="max-w-md mx-auto">
            <button 
              onClick={saveDiet}
              className="w-full bg-[#D4A373] text-white py-4 rounded-2xl shadow-xl shadow-[#D4A373]/20 font-medium tracking-widest text-[14px] active:scale-95 transition-all"
            >
              保存饮食偏好
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Preferences Sliding Panel */}
      <div 
        className={`fixed inset-0 z-50 bg-[#FDFBF9] text-[#4A3E3B] transition-transform duration-500 flex flex-col ${
           exercisePanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="flex-none px-6 pt-12 pb-6 relative border-b border-[#DECEC1]/20">
          <button 
            onClick={() => setExercisePanelOpen(false)}
            className="absolute top-12 right-6 p-2 text-[#4A3E3B] opacity-50 hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-serif text-[#4A3E3B]">运动偏好</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            {/* 1. 身体状态 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">1.</span>
                <h2 className="text-lg font-medium">身体状态</h2>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">基于当前感受，AI 推荐会动态调整</p>
              
              <div className="flex flex-wrap gap-2">
                 {["精力充沛","容易疲劳","腹痛/不适","腰酸背痛","情绪波动","睡眠佳","失眠多梦"].map(tag => (
                   <TagButton 
                     key={tag} label={tag} active={localExercise.conditions.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('conditions', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 2. 运动目标 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">2.</span>
                <h2 className="text-lg font-medium">运动目标</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                 {["舒缓压力","改善体态","增加力量","减脂塑形","助眠放松","缓解痛经"].map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localExercise.goals.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('goals', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 3. 运动场景 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">3.</span>
                <h2 className="text-lg font-medium">运动场景</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                 {["居家","健身房","户外","办公室"].map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localExercise.environment.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('environment', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 4. 重点关注/避坑 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">4.</span>
                <h2 className="text-lg font-medium">重点关注/避坑</h2>
                <span className="text-[10px] bg-[#FFE0E0] text-[#FF5A5A] px-2 py-0.5 rounded-full">注意</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 {["膝盖受损","盆底肌修护","腰部敏感","产后恢复","颈椎不适"].map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localExercise.avoiding.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('avoiding', tag)}
                   />
                 ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-none p-6 pt-2 pb-12 bg-white border-t border-[#DECEC1]/20">
          <div className="max-w-md mx-auto">
            <button 
              onClick={saveExercise}
              className="w-full bg-[#D4A373] text-white py-4 rounded-2xl shadow-xl shadow-[#D4A373]/20 font-medium tracking-widest text-[14px] active:scale-95 transition-all"
            >
              保存运动偏好
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[12px] uppercase tracking-[0.1em] opacity-50">
        {label}
      </div>
      {children}
    </div>
  );
}

function TagButton({ label, active, onClick, radio = false }: { 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  radio?: boolean;
  key?: React.Key;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] transition-all border ${
        active 
          ? (radio ? 'bg-[#D4A373] text-white border-[#D4A373]' : 'bg-[#F2ECE6] border-[#D4A373]/50 text-[#4A3E3B] shadow-sm') 
          : 'bg-[#F4ECE6] text-[#8C7B77] border-[#DECEC1] hover:border-[#D4A373]/30 hover:bg-[#F0E6DD]'
      }`}
    >
      {label}
    </button>
  );
}
