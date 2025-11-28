import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storyBlocks } from "@/features/luminous/data";

const Luminous = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Luminous Legends</p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Discover Your Order. Forge Your Legend.
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            A mythic identity experience that guides you from a 12-question quiz to a personalised legend book you can gift or
            keep.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/luminous/quiz">Start the quiz</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-slate-100 border-slate-600" asChild>
              <Link to="/luminous/checkout">Skip to checkout</Link>
            </Button>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Quiz", text: "Answer 12 reflective prompts to reveal your Order of Light." },
            { title: "Result", text: "See your Order, Lumenheart, and signature traits immediately." },
            { title: "Legend Book", text: "Download a PDF story crafted from your results." },
          ].map((item) => (
            <Card key={item.title} className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">{item.text}</CardContent>
            </Card>
          ))}
        </section>

        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">What you'll receive</h2>
          <p className="text-slate-300">
            A multi-page PDF crafted from your Order's stories, traits, and a closing blessing from the Book of Light edition.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-slate-200">
            <div>
              <p className="font-semibold mb-2">Opening tone</p>
              <p className="text-slate-300">{storyBlocks.openings["Book of Light"]}</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Closing blessing</p>
              <p className="text-slate-300">{storyBlocks.closings["Book of Light"]}</p>
            </div>
          </div>
          <div className="pt-4">
            <Button asChild>
              <Link to="/luminous/quiz">Begin now</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Luminous;
