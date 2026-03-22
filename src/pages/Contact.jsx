import React, { useState } from "react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants, titleVariants } from "../animations/motionVariants";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-20 pb-16 px-4 md:px-8 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-6 gradient-text">
          Get In Touch
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          We'd love to hear from you. Send us a message!
        </p>

        {/* Decorative line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mt-8"
        />
      </motion.div>

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            {/* Contact Info */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="mb-12">
                <h2 className="text-3xl font-bold gradient-text mb-6">Contact Information</h2>
                <p className="text-gray-400 mb-8">
                  Have questions? We're here to help! Reach out to us through any of these channels.
                </p>
              </div>

              {contactInfo.map((info, i) => (
                <ContactInfoCard key={i} {...info} />
              ))}

              {/* Social Links */}
              <motion.div
                variants={itemVariants}
                className="mt-12 pt-8 border-t border-orange-500/20"
              >
                <h3 className="text-xl font-bold text-orange-300 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {socialLinks.map((link, i) => (
                    <motion.a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-3xl hover:text-orange-300 transition-colors"
                    >
                      {link.icon}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={itemVariants}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all"
                    placeholder="What is this about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all resize-none"
                    placeholder="Tell us what you think..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249, 115, 22, 0.7)" }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg shadow-neon hover:shadow-neon-lg transition-all text-lg"
                >
                  Send Message 🚀
                </motion.button>
              </form>

              {/* Success Message */}
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 p-4 bg-green-500/20 border border-green-500 text-green-300 rounded-lg text-center font-semibold"
                >
                  ✓ Message sent successfully! We'll get back to you soon.
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 md:px-8 bg-dark-800/50">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold gradient-text mb-8 text-center"
          >
            Visit Us
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass backdrop-blur-xl p-8 rounded-2xl border border-orange-500/20"
          >
            <div className="bg-dark-900/50 rounded-lg w-full h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📍</div>
                <p className="text-xl font-semibold">Santafi Premium Fast Food</p>
                <p className="text-gray-500 mt-2">123 Food Street, Culinary City, CC 12345</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const ContactInfoCard = ({ icon, title, content }) => (
  <motion.div
    whileHover={{ x: 10 }}
    className="flex gap-4 p-4 rounded-lg hover:bg-dark-800/30 transition-colors"
  >
    <div className="text-3xl flex-shrink-0">{icon}</div>
    <div>
      <h4 className="font-semibold text-orange-300 mb-1">{title}</h4>
      <p className="text-gray-400">{content}</p>
    </div>
  </motion.div>
);

const contactInfo = [
  {
    icon: "📍",
    title: "Address",
    content:"ميت غمر :شارع بورسعيد بجوار توكيل براون ",
    content2: "المنصوره : شارع الترعه ميدان الاديب ",
    content3: "الزقازيق:شارع احمد اسماعيل بجوار ميدان القوميه",
  },
  {
    icon: "📞",
    title: "Phone",
    content: "+201000027130",
  },
  {
    icon: "📧",
    title: "Email",
    content: "santafefriedchicken@gmail.com",
  },
  {
    icon: "🕒",
    title: "Hours",
    content: "Mon - Sun: 10:00 AM - 11:00 PM",
  },
];

const socialLinks = [
  { icon: "f", url: "https://www.facebook.com/santafe.fried.chicken?locale=ar_AR" },
  { icon: "📷", url: "https://https://www.instagram.com/santafe_fried_chicken1?fbclid=IwY2xjawQsqYdleHRuA2FlbQIxMABicmlkETEwUWZQclJybU1iemp0OUpTc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHjASXw5-BclZ6r3HVecvI8jCfsNFoQFz09WMUldgdTJfiPADXlMQSByZ3ymh_aem_b9-qKfD71hIbV1vF75LfWw" },
];

export default Contact;
