"use client";
import { useState, useEffect } from "react";
import ProductForm from "./product-form";
import OutputTabs from "./output-tabs";
import { getPlanState, getTrialTimeLeft } from "@/lib/plan";

export function Generator() {
  const [kit,setKit]=useState<any>(null); const [loading,setLoading]=useState(false);
  const [trial,setTrial]=useState({hours:72,minutes:0,expired:false});
  useEffect(()=>{ setTrial(getTrialTimeLeft()); },[]);
  async function handleGenerate(data:any){
    const state=getPlanState();
    if(state.plan==='free' && state.generationsLeft===0){ alert('Trial expired - Subscribe $4.99'); return; }
    setLoading(true);
    try{
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const j=await res.json(); if(j.kit) setKit(j.kit);
    }catch(e){ alert('Failed'); } finally{ setLoading(false); }
  }
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div className="text-xs text-gray-500">Trial: {trial.expired?'Expired':`${trial.hours}h ${trial.minutes}m left`}</div>
      <ProductForm onGenerate={handleGenerate} loading={loading} />
      {kit && <OutputTabs kit={kit} />}
    </div>
  );
}
export default Generator;
