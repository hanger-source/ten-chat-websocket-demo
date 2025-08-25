export interface VoiceOption {
  category: string;
  voiceName: string;
  voiceTrait: string;
  voiceParam: string;
  language: string;
  ssml: string;
  permission: string;
}

export const voiceOptions: VoiceOption[] = [
  { category: '客服', voiceName: '龙应催', voiceTrait: '严肃催收男', voiceParam: 'longyingcui', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应答', voiceTrait: '开朗高音女', voiceParam: 'longyingda', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应静', voiceTrait: '低调冷静女', voiceParam: 'longyingjing', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应严', voiceTrait: '义正严辞女', voiceParam: 'longyingyan', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应甜', voiceTrait: '温柔甜美女', voiceParam: 'longyingtian', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应冰', voiceTrait: '尖锐强势女', voiceParam: 'longyingbing', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应桃', voiceTrait: '温柔淡定女', voiceParam: 'longyingtao', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '客服', voiceName: '龙应聆', voiceTrait: '温和共情女', voiceParam: 'longyingling', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '语音助手', voiceName: 'YUMI', voiceTrait: '正经青年女', voiceParam: 'longyumi_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '语音助手', voiceName: '龙小淳', voiceTrait: '知性积极女', voiceParam: 'longxiaochun_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '语音助手', voiceName: '龙小夏', voiceTrait: '沉稳权威女', voiceParam: 'longxiaoxia_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '直播带货', voiceName: '龙安燃', voiceTrait: '活泼质感女', voiceParam: 'longanran', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '直播带货', voiceName: '龙安宣', voiceTrait: '经典直播女', voiceParam: 'longanxuan', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '有声书', voiceName: '龙三叔', voiceTrait: '沉稳质感男', voiceParam: 'longsanshu', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '有声书', voiceName: '龙修', voiceTrait: '博才说书男', voiceParam: 'longxiu_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '有声书', voiceName: '龙妙', voiceTrait: '抑扬顿挫女', voiceParam: 'longmiao_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '有声书', voiceName: '龙悦', voiceTrait: '温暖磁性女', voiceParam: 'longyue_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '有声书', voiceName: '龙楠', voiceTrait: '睿智青年男', voiceParam: 'longnan_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '有声书', voiceName: '龙媛', voiceTrait: '温暖治愈女', voiceParam: 'longyuan_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙安柔', voiceTrait: '温柔闺蜜女', voiceParam: 'longanrou', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙嫱', voiceTrait: '浪漫风情女', voiceParam: 'longqiang_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙寒', voiceTrait: '温暖痴情男', voiceParam: 'longhan_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙星', voiceTrait: '温婉邻家女', voiceParam: 'longxing_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙华', voiceTrait: '元气甜美女', voiceParam: 'longhua_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙婉', voiceTrait: '积极知性女', voiceParam: 'longwan_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙橙', voiceTrait: '智慧青年男', voiceParam: 'longcheng_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙菲菲', voiceTrait: '甜美娇气女', voiceParam: 'longfeifei_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙小诚', voiceTrait: '磁性低音男', voiceParam: 'longxiaocheng_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙哲', voiceTrait: '呆板大暖男', voiceParam: 'longzhe_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙颜', voiceTrait: '温暖春风女', voiceParam: 'longyan_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙天', voiceTrait: '磁性理智男', voiceParam: 'longtian_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙泽', voiceTrait: '温暖元气男', voiceParam: 'longze_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙邵', voiceTrait: '积极向上男', voiceParam: 'longshao_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙浩', voiceTrait: '多情忧郁男', voiceParam: 'longhao_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '社交陪伴', voiceName: '龙深', voiceTrait: '实力歌手男', voiceParam: 'kabuleshen_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '童声', voiceName: '龙杰力豆', voiceTrait: '阳光顽皮男', voiceParam: 'longjielidou_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '童声', voiceName: '龙铃', voiceTrait: '稚气呆板女', voiceParam: 'longling_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '童声', voiceName: '龙可', voiceTrait: '懵懂乖乖女', voiceParam: 'longke_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '童声', voiceName: '龙仙', voiceTrait: '豪放可爱女', voiceParam: 'longxian_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '方言', voiceName: '龙老铁', voiceTrait: '东北直率男', voiceParam: 'longlaotie_v2', language: '中（东北）、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '方言', voiceName: '龙嘉怡', voiceTrait: '知性粤语女', voiceParam: 'longjiayi_v2', language: '中（粤语）、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '方言', voiceName: '龙桃', voiceTrait: '积极粤语女', voiceParam: 'longtao_v2', language: '中（粤语）、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '诗词朗诵', voiceName: '龙飞', voiceTrait: '热血磁性男', voiceParam: 'longfei_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '诗词朗诵', voiceName: '李白', voiceTrait: '古代诗仙男', voiceParam: 'libai_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '诗词朗诵', voiceName: '龙津', voiceTrait: '优雅温润男', voiceParam: 'longjin_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '新闻播报', voiceName: '龙书', voiceTrait: '沉稳青年男', voiceParam: 'longshu_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '新闻播报', voiceName: 'Bella2.0', voiceTrait: '精准干练女', voiceParam: 'loongbella_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '新闻播报', voiceName: '龙硕', voiceTrait: '博才干练男', voiceParam: 'longshuo_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '新闻播报', voiceName: '龙小白', voiceTrait: '沉稳播报女', voiceParam: 'longxiaobai_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '新闻播报', voiceName: '龙婧', voiceTrait: '典型播音女', voiceParam: 'longjing_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
  { category: '新闻播报', voiceName: 'loongstella', voiceTrait: '飒爽利落女', voiceParam: 'loongstella_v2', language: '中、英', ssml: '✅', permission: '✅可直接使用' },
];
