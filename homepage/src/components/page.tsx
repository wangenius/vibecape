import { useState } from "react";
import { CiMail } from "react-icons/ci";
import { Examples } from "./Examples";
import Features from "./Features";
import Hero from "./Hero";
import Models from "./Models";
import Testimonials from "./Testimonials";
import ToolKit from "./ToolKit";
import { Input } from "./ui/input";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  return (
    <div className="bg-gradient-to-b from-background to-background/95 min-h-screen">
      <Hero setIsScrolled={setIsScrolled} />
      <Examples isScrolled={isScrolled} />
      <Features />
      <ToolKit />
      <Models />
      <Testimonials />

      {/* 探索提示部分 */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-bold mb-10 flex items-center gap-4">
              <span>Ready to explore?</span>
            </div>
            <div className="my-4 md:mt-0">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-x-3"
              >
                <div className="relative w-[500px] mb-5">
                  <CiMail className="w-6 h-6 text-gray-400 absolute left-3 inset-y-0 my-auto" />
                  <Input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full outline-none bg-neutral-100 text-primary py-2 border border-transparent pl-12 pr-3 h-12 rounded-full focus:bg-white"
                  />
                </div>
              </form>
            </div>
            <div className="flex gap-4">
              <a
                href="#"
                className="px-8 py-3 bg-white !text-primary rounded-full font-medium hover:bg-opacity-90 transition-all !no-underline"
              >
                Subscribe
              </a>
              <a
                href="https://github.com"
                className="px-8 py-3 !text-white  bg-primary/10 rounded-full font-medium hover:bg-primary/30 transition-all !no-underline flex items-center"
              >
                Contact Us for business
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
