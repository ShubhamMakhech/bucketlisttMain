import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { destinationsData } from "./Blogs";
import { useEffect } from "react";
import { motion } from "framer-motion";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const blog = destinationsData.find((item) => item.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4 ">
          <h1 className="text-2xl font-bold mb-2">Blog Not Found</h1>
          <p className="text-muted-foreground">
            The blog you are looking for doesn’t exist.
          </p>
          <button
            onClick={() => navigate("/blogs")}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] md:h-[70vh] rounded-b-3xl overflow-hidden shadow-lg">
        <img
          src={blog.image_url}
          alt={blog.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white text-3xl md:text-5xl font-bold max-w-3xl px-4"
          >
            {blog.title}
          </motion.h1>
        </div>
      </div>

      {/* Blog Content */}
      <div className="container py-8 px-4 text-left">
        {/* Subtitle */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          {blog.subtitle}
        </p>

        {/* Sections */}
        {blog.sections?.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">
              {section.title}
            </h2>

            {/* Items */}
            <div className="space-y-4 pl-4 ">
              {section.items.map((item, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>

                  {/* Points */}
                  <ul className="list-disc list-inside space-y-1">
                    {item.points.map((point, p) => (
                      <li key={p} className="text-muted-foreground leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* CTA */}
        {/* {blog.cta && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-12"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-xl font-medium mb-4">{blog.cta}</p>
              <button
                onClick={() => navigate("/bookings")}
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-xl shadow hover:shadow-lg transition"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        )} */}
      </div>
    </div>
  );
};

export default BlogDetail;
