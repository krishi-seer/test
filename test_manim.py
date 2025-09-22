from manim import *

class TestAnimation(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a0a"
        
        # Simple test animation
        title = Text("8086 MUL Test", font_size=72, color="#00bfff")
        title_glow = title.copy().set_stroke("#00bfff", width=8, opacity=0.3)
        
        self.play(
            FadeIn(title_glow),
            Write(title),
            run_time=2
        )
        self.wait(1)
        
        self.play(
            FadeOut(title),
            FadeOut(title_glow),
            run_time=1
        )