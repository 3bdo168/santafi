import React from "react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants, titleVariants } from "../animations/motionVariants";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-20 pb-16 px-4 md:px-8 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-6 gradient-text">
          About santafi
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Crafting Premium Fast Food Excellence
        </p>

        {/* Decorative line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mt-8"
        />
      </motion.div>

      {/* Story Section */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold gradient-text mb-8">Our Story</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-gray-300 space-y-4 text-lg"
              >
                <p>
                  santafi was born from a passion for authentic, premium fast food. What
                  started as a small kitchen dream has evolved into a culinary movement,
                  dedicated to delivering exceptional quality with every order.
                </p>
                <p>
                  We believe that fast food doesn't have to compromise on taste, freshness,
                  or quality. Every ingredient is carefully selected, every recipe is
                  perfected, and every meal is prepared with love and precision.
                </p>
                <p>
                  Today, santafi stands as a testament to what's possible when passion
                  meets innovation in the fast-food industry.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-8xl text-center"
              >
                🔥
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 px-4 md:px-8 bg-dark-800/50">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-4xl font-bold gradient-text mb-12 text-center"
          >
            Our Core Values
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {values.map((value, i) => (
              <ValueCard key={i} {...value} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-4xl font-bold gradient-text mb-12 text-center"
          >
            Our Team
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {team.map((member, i) => (
              <TeamMember key={i} {...member} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 px-4 md:px-8 bg-dark-800/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {achievements.map((item, i) => (
              <AchievementCard key={i} {...item} />
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const ValueCard = ({ icon, title, description }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -10 }}
    className="glass backdrop-blur-xl p-8 rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all"
  >
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-2xl font-bold text-orange-300 mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const TeamMember = ({ emoji, role, description }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -10 }}
    className="glass backdrop-blur-xl p-8 rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all"
  >
    <div className="text-6xl mb-4">{emoji}</div>
    <h3 className="text-2xl font-bold text-orange-300 mb-2">{role}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const AchievementCard = ({ number, label, emoji }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.1 }}
    className="glass backdrop-blur-xl p-8 rounded-2xl border border-orange-500/20"
  >
    <div className="text-4xl mb-3">{emoji}</div>
    <div className="text-4xl font-black gradient-text mb-2">{number}</div>
    <p className="text-gray-300 font-semibold">{label}</p>
  </motion.div>
);

const values = [
  {
    icon: "⭐",
    title: "Quality First",
    description: "Every ingredient, every preparation, every detail matters. We never compromise.",
  },
  {
    icon: "🚀",
    title: "Innovation",
    description: "Constantly evolving our menu and service to exceed customer expectations.",
  },
  {
    icon: "❤️",
    title: "Passion",
    description: "Our love for food and customers drives everything we do every single day.",
  },
];

const team = [
  {
    emoji: "👨‍🍳",
    role: "Head Chef",
    description: "Leading our culinary team with decades of experience in premium fast-food cuisine.",
  },
  {
    emoji: "👩‍💼",
    role: "Operations Manager",
    description: "Ensuring flawless execution and exceptional service every single day.",
  },
  {
    emoji: "👨‍💻",
    role: "Innovation Lead",
    description: "Driving new menu items and technology solutions for our customers.",
  },
  {
    emoji: "🌟",
    role: "Customer Experience",
    description: "Dedicated to making every interaction with santafi memorable and delightful.",
  },
];

const achievements = [
  {
    number: "50K+",
    label: "Happy Customers",
    emoji: "😊",
  },
  {
    number: "100+",
    label: "Menu Items",
    emoji: "🍔",
  },
  {
    number: "2024",
    label: "Year Founded",
    emoji: "🎉",
  },
];

export default About;
