/* 内容库数据：英雄 / 地图（与 hero_content_library.json 同构） */
/* ================= 内容库（与 hero_content_library.json 同构；正式版存于腾讯 ima valorantHeroKnow 共享知识库） ================= */
const HEROES = [
  {id:"jett",name_cn:"捷风",name_en:"Jett",role:"决斗者",
   one_liner:"高机动刺客：位移进出场，靠身位拉扯换血，大招收割残局",
   skills:{
     Q:{name:"漂流",cost:"200",desc:"激活后向移动方向瞬间冲刺，烟雾中可二次使用",gif:""},
     C:{name:"涌云",cost:"200",desc:"扔出烟云遮挡视野，配合漂流穿烟突进",gif:""},
     E:{name:"上升气流",cost:"免费·冷却",desc:"双人高度的腾空跳跃，上高台拿枪线或躲技能",gif:""},
     X:{name:"刀刃风暴",cost:"8点",desc:"换装飞刀：爆头直接击杀并回满飞刀，连续击杀非常强",gif:""}},
   quick_tips:["进场先想好退路：Q/E 至少留一个保命","大招期间身位比枪法重要，优先侧翼切入","别用涌云当进攻烟，它是单点遮蔽不是控场烟"],
   videos:[
     {title:"捷风 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%8D%B7%E9%A3%8E%20%E6%95%99%E5%AD%A6"},
     {title:"Jett 官方Wiki",url:"https://valorant.fandom.com/wiki/Jett"}]},
  {id:"sage",name_cn:"贤者",name_en:"Sage",role:"哨卫",
   one_liner:"治疗+控场辅助：墙分割战场，大招复活是全队最大的容错",
   skills:{
     Q:{name:"缓速球",cost:"200",desc:"区域减速+显示脚印，封路或保队友撤退",gif:""},
     C:{name:"屏障球",cost:"400",desc:"竖起冰墙：挡枪线/堵人/垫脚上高点",gif:""},
     E:{name:"治疗球",cost:"免费·冷却",desc:"长按治疗队友，短按治疗自己",gif:""},
     X:{name:"复活",cost:"8点",desc:"复活阵亡队友（满血但武器为手枪），注意读条时机",gif:""}},
   quick_tips:["墙别封队友枪线——起墙前看队友站位","大招留给关键人：决斗者/携带大哥武器的人","缓速球扔在敌人必经的转角，比扔脚下有用"],
   videos:[
     {title:"贤者 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E8%B4%A4%E8%80%85%20%E6%95%99%E5%AD%A6"},
     {title:"Sage 官方Wiki",url:"https://valorant.fandom.com/wiki/Sage"}]},
  {id:"reyna",name_cn:"蕾娜",name_en:"Reyna",role:"决斗者",
   one_liner:"击杀滚雪球型单挑战士：一切强度建立在'打得死人'上",
   skills:{
     Q:{name:"吞噬",cost:"200",desc:"击杀后吸收魂魄快速回血（大招期间加速）",gif:""},
     C:{name:"魔眼",cost:"250",desc:"放出魔眼让视野内敌人短暂近视，强开枪线用",gif:""},
     E:{name:"消散",cost:"200",desc:"击杀后变无敌快速位移，撤出或换点位",gif:""},
     X:{name:"女皇",cost:"6点",desc:"狂暴模式：大幅提升射速与换弹速度，击杀刷新吞噬/消散",gif:""}},
   quick_tips:["蕾娜没有位移保命技能——进战前确认能打过","Q/E 的释放依赖击杀产生的魂魄，别空放","女皇大招期间主动找 1v1，避开多人交叉火力"],
   videos:[
     {title:"蕾娜 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E8%95%BE%E5%A8%9C%20%E6%95%99%E5%AD%A6"},
     {title:"Reyna 官方Wiki",url:"https://valorant.fandom.com/wiki/Reyna"}]},
  {id:"skye",name_cn:"斯凯",name_en:"Skye",role:"先锋",
   one_liner:"驭兽先锋：闪光自带命中确认、袋狼可控探路，还能治疗队友的全能型辅助",
   skills:{
     Q:{name:"辟林之虎",cost:"300",desc:"放出并操控袋狼，再按射击扑击：震荡+伤害，探点开路两不误",gif:""},
     C:{name:"愈生之息",cost:"150",desc:"按住引导治疗范围内视线内的队友（100 治疗池），不能治疗自己",gif:""},
     E:{name:"引路之隼",cost:"250×2",desc:"放出可控飞鹰，再按引爆为闪光；致盲成功有命中提示音，闪完直接报点",gif:""},
     X:{name:"追猎之灵",cost:"8点",desc:"放出 3 个追猎者追踪最近敌人，命中使其视野收缩；可被击毁",gif:""}},
   quick_tips:["闪光听到命中确认音再喊队友拉枪线——这是斯凯比其他闪光强的地方","操控袋狼/飞鹰时本体站桩：先躲进掩体再操控，别站大马路上","愈生之息只奶队友不奶自己，残局别把它当贤者治疗球用"],
   videos:[
     {title:"斯凯 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%96%AF%E5%87%AF%20%E6%95%99%E5%AD%A6"},
     {title:"Skye 官方Wiki",url:"https://valorant.fandom.com/wiki/Skye"}]},
  {id:"fade",name_cn:"黑梦",name_en:"Fade",role:"先锋",
   one_liner:"梦魇猎人：诡眼揭露位置、黯兽循迹追击，把敌方行踪摊在明面上的信息位",
   skills:{
     Q:{name:"幽爪",cost:"200",desc:"套索落地炸裂：束缚+致聋+腐坏（扣 75 上限生命），封路口/守拆包神技",gif:""},
     C:{name:"黯兽",cost:"250×2",desc:"放出梦魇兽追击第一个敌人或恐惧轨迹，命中使其视野收缩",gif:""},
     E:{name:"诡眼",cost:"免费·冷却",desc:"掷出诡眼爆裂，揭露视线内敌人并留下恐惧轨迹；可被击毁，落点要刁钻",gif:""},
     X:{name:"夜临",cost:"8点",desc:"释放穿墙梦魇波：命中留下轨迹+致聋+腐坏，开团/收残局两用",gif:""}},
   quick_tips:["先诡眼后黯兽：恐惧轨迹让黯兽加速追击，combo 命中率翻倍","幽爪扔包点或必经路口，进攻封回防、防守封拆包都好用","你打的是信息不是输出——轨迹全队可见，多报点少对枪"],
   videos:[
     {title:"黑梦 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E9%BB%91%E6%A2%A6%20%E6%95%99%E5%AD%A6"},
     {title:"Fade 官方Wiki",url:"https://valorant.fandom.com/wiki/Fade"}]},
  {id:"sova",name_cn:"猎枭",name_en:"Sova",role:"先锋",
   one_liner:"战场侦察大师：寻敌箭+无人机拿信息，穿墙能量箭收割残局",
   skills:{
     Q:{name:"雷击箭",cost:"150×2",desc:"射出电击箭碰撞爆炸（中心最高 75 伤害），可蓄力延距、右键加弹射",gif:""},
     C:{name:"枭型无人机",cost:"400",desc:"操控无人机侦察并发射定位镖标记敌人；操控期间本体站桩",gif:""},
     E:{name:"寻敌箭",cost:"免费·冷却",desc:"箭矢落点声纳 3 次脉冲揭露范围内敌人；血量 20 会被打掉，落点要讲究",gif:""},
     X:{name:"狂猎之怒",cost:"8点",desc:"3 发穿墙能量箭，每发 80 伤害并揭露命中者，清残局/逼位移",gif:""}},
   quick_tips:["背熟每张图 2-3 个常用寻敌箭点位，比枪法更能赢下回合","看到敌方寻敌箭/无人机落地就打掉——都只有几十血","大招有弹道预警，收残血别贪满血；穿墙特性适合拆包时逼位"],
   videos:[
     {title:"猎枭 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E7%8C%8E%E6%9E%AD%20%E6%95%99%E5%AD%A6"},
     {title:"Sova 官方Wiki",url:"https://valorant.fandom.com/wiki/Sova"}]},
  {id:"kayo",name_cn:"KAY/O",name_en:"KAY/O",role:"先锋",
   one_liner:"压制机器：一把匕首废掉范围内敌人全部技能，快爆闪光强开点",
   skills:{
     Q:{name:"闪存过载",cost:"250×2",desc:"闪光榴弹：左键上手投掷延时爆，右键下手快爆，致盲 2.25 秒",gif:""},
     C:{name:"碎片溢出",cost:"200",desc:"粘地手雷连续 4 次爆炸（越靠中心越痛），清角落/守包点两用",gif:""},
     E:{name:"零点嗅探",cost:"免费·冷却",desc:"掷出压制匕首，爆裂压制范围内敌人 8 秒无法用技能，并语音报人数",gif:""},
     X:{name:"无效命令",cost:"8点",desc:"持续脉冲大范围压制+自身战斗强化；期间被击倒可由队友重启复活",gif:""}},
   quick_tips:["E 刀有命中人数播报：0 人压制≈点位可能空，果断转点或 rush","右键快爆闪光自己拉出去打；左键长延时留给队友创造进场","对面奇乐/贤者这类技能守点位，你的刀就是全队开点信号弹"],
   videos:[
     {title:"KAY/O 入门教学（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20KAY%2FO%20%E6%95%99%E5%AD%A6"},
     {title:"KAY/O 官方Wiki",url:"https://valorant.fandom.com/wiki/KAY/O"}]}
];

const MAPS = [
  {id:"ascent",name_cn:"亚海悬城",name_en:"Ascent",
   one_liner:"中门决定全图节奏的双点图：中路失守，A/B 防守都难受",
   tips:["中门是胜负手：开局优先争夺中路控制","A/B 大门可开关，开门音效是重要信息","守方善用门后枪线；攻方开点必须带技能"],
   videos:[{title:"亚海悬城 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E4%BA%9A%E6%B5%B7%E6%82%AC%E5%9F%8E%20%E6%94%BB%E7%95%A5"}]},
  {id:"haven",name_cn:"隐世修所",name_en:"Haven",
   one_liner:"三点图：信息比人数重要，别死守一个点",
   tips:["三点分兵防守，换点响应速度要快","C 长廊枪线很长，先想好怎么过","听到转点信息立刻呼应，晚一步就是 3 打 2 逆转"],
   videos:[{title:"隐世修所 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E9%9A%90%E4%B8%96%E4%BF%AE%E6%89%80%20%E6%94%BB%E7%95%A5"}]},
  {id:"split",name_cn:"霓虹町",name_en:"Split",
   one_liner:"上下双层结构：控制中路绳索区 = 控制换线速度",
   tips:["中路绳索区是攻防双方必争的枢纽","A 点高台易守难攻，进攻方带清点技能","防守别在 B 底层恋战，容易被包后路"],
   videos:[{title:"霓虹町 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E9%9C%93%E8%99%B9%E7%94%BA%20%E6%94%BB%E7%95%A5"}]},
  {id:"icebox",name_cn:"森寒冬港",name_en:"Icebox",
   one_liner:"垂直空间最多的图：站位先想清楚上下层关系",
   tips:["垂直枪线多，走位时想清楚'谁在上面'","A 点管道区是攻方主路线，守方多留技能","守点技能留到对方进场瞬间再交，别提前浪费"],
   videos:[{title:"森寒冬港 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%A3%AE%E6%9E%97%E5%86%AC%E6%B8%AF%20%E6%94%BB%E7%95%A5"}]},
  {id:"breeze",name_cn:"微风岛屿",name_en:"Breeze",
   one_liner:"大开阔图：长枪线对枪比绕路更划算",
   tips:["中路对枪优势大，狙和长枪优先拿中","守点靠烟与延迟技能，别裸站在开阔地","B 点入口多，信息位优先报点"],
   videos:[{title:"微风岛屿 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E5%BE%AE%E9%A3%8E%E5%B2%9B%E5%B1%BF%20%E6%94%BB%E7%95%A5"}]},
  {id:"lotus",name_cn:"莲华古城",name_en:"Lotus",
   one_liner:"带旋转门的三点图：转点节奏快，大招交点常在中门",
   tips:["旋转门开合声音是关键信息，学会听","A 点水路很安静，留意脚步与绕后","三点图信息优先，技能别一次性交空"],
   videos:[{title:"莲华古城 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E8%8E%B2%E5%8D%8E%E5%8F%A4%E5%9F%8E%20%E6%94%BB%E7%95%A5"}]},
  {id:"pearl",name_cn:"深海明珠",name_en:"Pearl",
   one_liner:"无机关两点图：中路控制决定全图节奏",
   tips:["中路拿下来，A/B 随时可以切换施压","A 点商店口与 B 主道是主要战场","防守方换位要早，别等破点才动"],
   videos:[{title:"深海明珠 攻略（B站）",url:"https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%B7%B1%E6%B5%B7%E6%98%8E%E7%8F%A0%20%E6%94%BB%E7%95%A5"}]}
];
