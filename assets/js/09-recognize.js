/* AI 识别截图（OpenAI / Gemini 多模态，失败自动降级手动选择） */
/* ================= AI 识别（可选，英雄+地图） ================= */
$("saveKey").onclick=()=>{localStorage.setItem("vkey",$("apikey").value.trim());show("ok","Key 已保存在本机")};
$("apikey").value=localStorage.getItem("vkey")||"";

$("aiBtn").onclick=async()=>{
  const key=($("apikey").value||"").trim();
  if(!imgDataUrl)return show("err","请先上传或 Ctrl+V 粘贴一张加载界面截图");
  if(!key)return show("err","未配置模型 Key —— 可先用手动选择流程体验完整功能，或展开「AI 识别设置」填入 Key");
  show("ok","识别中…（约 3–8 秒）");
  const hlist=HEROES.map(h=>`${h.name_cn}/${h.name_en}`).join("、");
  const mlist=MAPS.map(m=>`${m.name_cn}/${m.name_en}`).join("、");
  const prompt=`这是游戏《无畏契约(VALORANT)》的对局加载/选人界面截图。请从以下英雄列表中识别出"我"（本方队伍）所选的英雄：[${hlist}]；并从以下地图列表中识别对局地图：[${mlist}]。只返回JSON：{"hero_en":"英雄英文ID或null","map_en":"地图英文ID或null","confidence":0到1的小数}，不要其他文字。`;
  try{
    let text="";
    if($("provider").value==="openai"){
      const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body:JSON.stringify({model:"gpt-4o",messages:[{role:"user",content:[
          {type:"text",text:prompt},{type:"image_url",image_url:{url:imgDataUrl}}]}],max_tokens:100})});
      if(!r.ok)throw new Error("OpenAI 接口返回 "+r.status+"（检查 Key/余额）");
      text=(await r.json()).choices[0].message.content;
    }else{
      const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+key,
        {method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:"image/jpeg",data:imgDataUrl.split(",")[1]}}]}]})});
      if(!r.ok)throw new Error("Gemini 接口返回 "+r.status+"（检查 Key）");
      text=(await r.json()).candidates[0].content.parts[0].text;
    }
    const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error("模型未返回有效JSON");
    const j=JSON.parse(m[0]);
    const h=HEROES.find(x=>x.id===j.hero_en||x.name_en===j.hero_en||x.name_cn===j.hero_en);
    const mp=MAPS.find(x=>x.id===j.map_en||x.name_en===j.map_en||x.name_cn===j.map_en);
    if(!h){
      show("err","识别置信度低 —— 已降级：请直接手动选择英雄（这正是设计的兜底路径）");
      $("card").style.display="none";return;
    }
    if(mp){const mi=MAPS.indexOf(mp);if(mi>=0)$("mapSel").value=mi}
    show("ok",`识别为「${h.name_cn}」${mp?" · 地图「"+mp.name_cn+"」":""}（置信度 ${(j.confidence*100||"?").toString().slice(0,4)}%）—— 已生成速记卡，识别错了点右上角换一个`);
    render(h.id,mp?mp.id:null);
  }catch(err){show("err","识别失败："+err.message+" —— 降级为手动选择，功能不受影响")}
};
