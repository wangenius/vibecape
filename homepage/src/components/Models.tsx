import { motion } from 'framer-motion';
import { PiEyeBold, PiImageSquareBold, PiMicrophoneStageBold, PiTextTBold, PiVideoBold } from "react-icons/pi";
import { TbPhotoEdit, TbVectorTriangle, TbZoomPan } from "react-icons/tb";

const Models = () => {
  const modelCategories = [
    {
      title: '文本模型',
      description: '自然语言处理和文本生成',
      icon: PiTextTBold,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-600',
    },
    {
      title: '文生图',
      description: '由文本描述生成图像',
      icon: PiImageSquareBold,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-600',
    },
    {
      title: 'VL模型',
      description: '视觉语言多模态理解',
      icon: PiEyeBold,
      color: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-600',
    },
    {
      title: '语音模型',
      description: '语音识别与合成',
      icon: PiMicrophoneStageBold,
      color: 'from-pink-500/20 to-pink-600/20',
      iconColor: 'text-pink-600',
    },
    {
      title: 'Embeddings模型',
      description: '向量表示与检索',
      icon: TbVectorTriangle,
      color: 'from-emerald-500/20 to-emerald-600/20',
      iconColor: 'text-emerald-600',
    },
    {
      title: '图生图',
      description: '图像编辑与转换',
      icon: TbPhotoEdit,
      color: 'from-amber-500/20 to-amber-600/20',
      iconColor: 'text-amber-600',
    },
    {
      title: '视频模型',
      description: '视频生成与理解',
      icon: PiVideoBold,
      color: 'from-sky-500/20 to-sky-600/20',
      iconColor: 'text-sky-600',
    },
    {
      title: '多模态模型',
      description: '跨模态交互理解',
      icon: TbZoomPan,
      color: 'from-rose-500/20 to-rose-600/20',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Models Support</span>

        </motion.div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modelCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div 
                key={index} 
                className="flex flex-col items-center text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 bg-gradient-to-br border border-border/30 hover:border-primary/20 group"
              >
                <div className={`h-20 w-20 relative mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} p-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`w-10 h-10 ${category.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Models; 