from manim import *
import numpy as np

# Configure for 1920x1080 at 30fps as per memory specifications
config.pixel_height = 1080
config.pixel_width = 1920
config.frame_rate = 30

class MUL8086Animation(Scene):
    def construct(self):
        # Configure scene
        self.camera.background_color = "#0a0a0a"
        
        # Define colors
        NEON_BLUE = "#00bfff"
        NEON_RED = "#ff0040"
        NEON_GREEN = "#00ff80"
        NEON_YELLOW = "#ffff00"
        DARK_GRAY = "#2a2a2a"
        
        # 1. Extended Intro Scene with CPU Overview
        self.intro_scene_extended()
        
        # 2. CPU Architecture Overview
        self.cpu_architecture_overview()
        
        # 3. Register Setup with detailed explanation
        ax_reg, bx_reg, dx_reg = self.setup_registers_detailed()
        
        # 4. Memory and PC Setup with address explanation
        memory_cell, pc_arrow, ir_reg = self.setup_memory_and_pc_detailed()
        
        # 5. Instruction Fetch with step-by-step breakdown
        self.instruction_fetch_detailed(memory_cell, pc_arrow, ir_reg)
        
        # 6. Control Unit and Decode with microcode explanation
        control_unit = self.decode_instruction_detailed(ir_reg)
        
        # 7. ALU Setup with internal structure
        alu = self.setup_alu_detailed()
        
        # 8. Operand Fetch with data path explanation
        self.operand_fetch_detailed(ax_reg, bx_reg, alu)
        
        # 9. Execute Multiplication with bit-level operations
        self.execute_multiplication_detailed(alu, ax_reg, bx_reg)
        
        # 10. Write Back Results with register updates
        self.write_back_results_detailed(alu, ax_reg, dx_reg)
        
        # 11. Update Flags with condition explanation
        self.update_flags_detailed()
        
        # 12. Performance Analysis
        self.performance_analysis()
        
        # 13. Extended Final Summary with recap
        self.final_summary_extended(ax_reg, dx_reg)
    
    def intro_scene_extended(self):
        """Extended intro with CPU overview"""
        # Main title with enhanced glow
        title = Text("8086 MUL Instruction", font_size=80, color="#00bfff")
        subtitle = Text("Execution Cycle Animation", font_size=52, color="#80c0ff")
        subtitle.next_to(title, DOWN, buff=0.7)
        
        # Multiple glow layers for better effect
        title_glow1 = title.copy().set_stroke("#00bfff", width=12, opacity=0.2)
        title_glow2 = title.copy().set_stroke("#00bfff", width=6, opacity=0.4)
        
        self.play(
            FadeIn(title_glow1),
            FadeIn(title_glow2),
            Write(title),
            run_time=3
        )
        self.play(FadeIn(subtitle), run_time=2)
        self.wait(2)
        
        # Add processor info
        processor_info = Text(
            "Intel 8086 Microprocessor\n16-bit Architecture\nClock Speed: 5-10 MHz",
            font_size=24, color="#80c0ff", line_spacing=1.5
        )
        processor_info.to_edge(DOWN, buff=1.5)
        
        self.play(FadeIn(processor_info), run_time=2)
        self.wait(2)
        
        self.play(
            FadeOut(title),
            FadeOut(title_glow1),
            FadeOut(title_glow2),
            FadeOut(subtitle),
            FadeOut(processor_info),
            run_time=2
        )
    
    def cpu_architecture_overview(self):
        """Show CPU architecture components"""
        arch_title = Text("8086 CPU Architecture", font_size=48, color="#00bfff")
        arch_title.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(arch_title), run_time=1.5)
        
        # CPU components
        components = [
            "Execution Unit (EU)",
            "Bus Interface Unit (BIU)", 
            "Arithmetic Logic Unit (ALU)",
            "Control Unit (CU)",
            "Registers (AX, BX, CX, DX)",
            "Instruction Queue (6 bytes)"
        ]
        
        component_group = VGroup()
        for i, comp in enumerate(components):
            comp_text = Text(comp, font_size=20, color="#80ff80")
            comp_text.move_to(LEFT * 3 + UP * (2 - i * 0.7))
            component_group.add(comp_text)
        
        # Animate components appearing one by one
        for comp in component_group:
            self.play(FadeIn(comp), run_time=0.8)
            self.wait(0.3)
        
        # Show instruction pipeline
        pipeline_title = Text("Instruction Pipeline", font_size=24, color="#ffff00")
        pipeline_title.move_to(RIGHT * 3 + UP * 2)
        
        pipeline_steps = [
            "1. Fetch",
            "2. Decode", 
            "3. Execute",
            "4. Memory Access",
            "5. Write Back",
            "6. Update Flags"
        ]
        
        pipeline_group = VGroup()
        for i, step in enumerate(pipeline_steps):
            step_text = Text(step, font_size=18, color="#ffff80")
            step_text.move_to(RIGHT * 3 + UP * (1.2 - i * 0.5))
            pipeline_group.add(step_text)
        
        self.play(FadeIn(pipeline_title), run_time=1)
        
        for step in pipeline_group:
            self.play(FadeIn(step), run_time=0.6)
            self.wait(0.2)
        
        self.wait(3)
        
        # Clean up
        self.play(
            FadeOut(arch_title),
            FadeOut(component_group),
            FadeOut(pipeline_title),
            FadeOut(pipeline_group),
            run_time=2
        )
    
    def setup_registers(self):
        """Create and position register displays with proper spacing"""
        # Create register boxes with consistent spacing
        box_width, box_height = 2.2, 1.2  # Slightly larger for better visibility
        
        ax_box = Rectangle(width=box_width, height=box_height, color="#00bfff", fill_opacity=0.1)
        bx_box = Rectangle(width=box_width, height=box_height, color="#00bfff", fill_opacity=0.1)
        dx_box = Rectangle(width=box_width, height=box_height, color="#00bfff", fill_opacity=0.1)
        
        # Register labels and values with proper sizing
        ax_label = Text("AX", font_size=22, color="#00bfff")
        ax_value = Text("0x9000", font_size=18, color=WHITE)
        
        bx_label = Text("BX", font_size=22, color="#00bfff")
        bx_value = Text("0x0003", font_size=18, color=WHITE)
        
        dx_label = Text("DX", font_size=22, color="#00bfff")
        dx_value = Text("0x0000", font_size=18, color=WHITE)
        
        # Position registers with more space
        ax_box.to_edge(LEFT, buff=1.5).shift(UP * 2.5)
        bx_box.next_to(ax_box, DOWN, buff=0.8)  # Increased spacing
        dx_box.next_to(bx_box, DOWN, buff=0.8)
        
        # Position labels and values properly inside boxes
        ax_label.next_to(ax_box, UP, buff=0.15)
        ax_value.move_to(ax_box.get_center())
        
        bx_label.next_to(bx_box, UP, buff=0.15)
        bx_value.move_to(bx_box.get_center())
        
        dx_label.next_to(dx_box, UP, buff=0.15)
        dx_value.move_to(dx_box.get_center())
        
        # Group registers
        ax_reg = VGroup(ax_box, ax_label, ax_value)
        bx_reg = VGroup(bx_box, bx_label, bx_value)
        dx_reg = VGroup(dx_box, dx_label, dx_value)
        
        # Animate register appearance
        self.play(
            GrowFromCenter(ax_reg),
            GrowFromCenter(bx_reg),
            GrowFromCenter(dx_reg),
            run_time=2
        )
        
        # Add description with proper positioning
        desc = Text("Initial Register Values", font_size=30, color="#80c0ff")
        desc.to_edge(UP, buff=0.8)
        self.play(FadeIn(desc), run_time=1)
        self.wait(1.5)
        self.play(FadeOut(desc), run_time=0.5)
        
        return ax_reg, bx_reg, dx_reg
    
    def setup_registers_detailed(self):
        """Create and position register displays with detailed explanations"""
        # Clear any existing elements first
        self.clear()
        
        # Stage title with better positioning
        stage_title = Text("CPU Registers Setup", font_size=42, color="#00bfff")
        stage_title.to_edge(UP, buff=0.3)
        
        self.play(FadeIn(stage_title), run_time=1.5)
        
        # Create register boxes with better spacing
        ax_box = Rectangle(width=2.5, height=1.2, color="#00bfff", fill_opacity=0.15)
        bx_box = Rectangle(width=2.5, height=1.2, color="#00bfff", fill_opacity=0.15)
        dx_box = Rectangle(width=2.5, height=1.2, color="#00bfff", fill_opacity=0.15)
        
        # Register labels and values with better fonts
        ax_label = Text("AX", font_size=28, color="#00bfff", weight=BOLD)
        ax_value = Text("0xFFFF", font_size=24, color=WHITE)
        ax_desc = Text("Accumulator", font_size=14, color="#80c0ff")
        
        bx_label = Text("BX", font_size=28, color="#00bfff", weight=BOLD)
        bx_value = Text("0xFFFF", font_size=24, color=WHITE)
        bx_desc = Text("Base Register", font_size=14, color="#80c0ff")
        
        dx_label = Text("DX", font_size=28, color="#00bfff", weight=BOLD)
        dx_value = Text("0x0000", font_size=24, color=WHITE)
        dx_desc = Text("Data Register", font_size=14, color="#80c0ff")
        
        # Better positioning to avoid overlap - move further left and adjust vertical spacing
        ax_box.to_edge(LEFT, buff=0.5).shift(UP * 2.5)
        bx_box.next_to(ax_box, DOWN, buff=1.2)
        dx_box.next_to(bx_box, DOWN, buff=1.2)
        
        # Position labels and values with proper spacing
        ax_label.move_to(ax_box.get_top() + DOWN * 0.2)
        ax_value.move_to(ax_box.get_center())
        ax_desc.move_to(ax_box.get_bottom() + UP * 0.15)
        
        bx_label.move_to(bx_box.get_top() + DOWN * 0.2)
        bx_value.move_to(bx_box.get_center())
        bx_desc.move_to(bx_box.get_bottom() + UP * 0.15)
        
        dx_label.move_to(dx_box.get_top() + DOWN * 0.2)
        dx_value.move_to(dx_box.get_center())
        dx_desc.move_to(dx_box.get_bottom() + UP * 0.15)
        
        # Group registers
        ax_reg = VGroup(ax_box, ax_label, ax_value, ax_desc)
        bx_reg = VGroup(bx_box, bx_label, bx_value, bx_desc)
        dx_reg = VGroup(dx_box, dx_label, dx_value, dx_desc)
        
        # Animate register appearance with staggered timing
        self.play(GrowFromCenter(ax_reg), run_time=1.5)
        self.wait(0.5)
        self.play(GrowFromCenter(bx_reg), run_time=1.5)
        self.wait(0.5)
        self.play(GrowFromCenter(dx_reg), run_time=1.5)
        
        # Add detailed explanation with proper positioning - move to right side
        explanation = Text(
            "AX (Accumulator): Multiplicand = 65,535 decimal\n"
            "BX (Base): Multiplier = 65,535 decimal\n"
            "DX (Data): Will store high 16 bits of result",
            font_size=18, color="#80c0ff", line_spacing=1.3
        )
        explanation.move_to(RIGHT * 4.5 + UP * 1)
        
        self.play(FadeIn(explanation), run_time=2)
        self.wait(3)
        
        # Clean up stage title and explanation
        self.play(
            FadeOut(stage_title),
            FadeOut(explanation),
            run_time=1
        )
        
        return ax_reg, bx_reg, dx_reg
    
    def setup_memory_and_pc(self):
        """Setup memory cell, PC, and instruction register with proper spacing"""
        # Memory cell with better positioning - move to right side
        memory_box = Rectangle(width=3, height=1.5, color="#00bfff", fill_opacity=0.1)
        memory_box.move_to(RIGHT * 4.5 + UP * 3)
        
        memory_addr = Text("1000h", font_size=16, color="#80c0ff")
        memory_addr.next_to(memory_box, UP, buff=0.2)
        
        memory_instr = Text("F7 E3\n(MUL BX)", font_size=14, color=WHITE)
        memory_instr.move_to(memory_box.get_center())
        
        memory_cell = VGroup(memory_box, memory_addr, memory_instr)
        
        # Program Counter arrow with proper spacing
        pc_arrow_shape = Arrow(
            start=memory_box.get_left() + LEFT * 2,
            end=memory_box.get_left() + LEFT * 0.1,
            color="#ffff00",
            stroke_width=4
        )
        pc_label = Text("PC", font_size=18, color="#ffff00")
        pc_label.next_to(pc_arrow_shape, LEFT, buff=0.3)
        
        pc_arrow = VGroup(pc_arrow_shape, pc_label)
        
        # Instruction Register with proper spacing from memory
        ir_box = Rectangle(width=2.5, height=1.2, color="#00bfff", fill_opacity=0.1)
        ir_box.next_to(memory_box, DOWN, buff=1.5)  # More space from memory
        
        ir_label = Text("IR", font_size=20, color="#00bfff")
        ir_label.next_to(ir_box, UP, buff=0.15)
        
        ir_value = Text("F7 E3", font_size=16, color=WHITE)
        ir_value.move_to(ir_box.get_center())
        
        ir_reg = VGroup(ir_box, ir_label, ir_value)
        
        return memory_cell, pc_arrow, ir_reg
    
    def instruction_fetch(self, memory_cell, pc_arrow, ir_reg):
        """Animate instruction fetch process"""
        # Show fetch stage title
        fetch_title = Text("Instruction Fetch", font_size=36, color="#00bfff")
        fetch_title.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(fetch_title), run_time=1)
        
        # Show memory and PC - animate arrow shape separately
        self.play(
            GrowFromCenter(memory_cell),
            GrowArrow(pc_arrow[0]),  # Animate just the arrow shape
            run_time=2
        )
        
        # Show PC label
        self.play(FadeIn(pc_arrow[1]), run_time=0.5)
        
        # Create flowing data path from memory to IR using regular arrow
        data_path = Arrow(
            start=memory_cell[0].get_bottom(),
            end=ir_reg[0].get_top(),
            color="#00bfff",
            stroke_width=6
        )
        
        # Animate instruction flow
        self.play(GrowArrow(data_path), run_time=1.5)
        
        # Show IR appearing
        self.play(GrowFromCenter(ir_reg), run_time=1.5)
        
        # Animate data flowing
        flowing_dot = Dot(color="#00bfff").move_to(data_path.get_start())
        self.add(flowing_dot)
        
        self.play(
            MoveAlongPath(flowing_dot, data_path),
            run_time=2
        )
        
        # Flash IR to show data received
        self.play(
            ir_reg.animate.set_stroke("#00bfff", width=4, opacity=0.8),
            run_time=0.5
        )
        self.play(
            ir_reg.animate.set_stroke("#00bfff", width=1, opacity=1),
            run_time=0.5
        )
        
        # Clean up
        self.play(
            FadeOut(fetch_title),
            FadeOut(flowing_dot),
            FadeOut(data_path),
            run_time=1
        )
    
    def decode_instruction(self, ir_reg):
        """Animate instruction decode process with proper spacing"""
        # Show decode stage title
        decode_title = Text("Instruction Decode", font_size=32, color="#ff0040")
        decode_title.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(decode_title), run_time=1)
        
        # Create control unit with better positioning - move to avoid overlap
        cu_box = Rectangle(width=3.2, height=1.6, color="#ff0040", fill_opacity=0.1)
        cu_box.move_to(RIGHT * 2.5 + DOWN * 0.5)
        
        cu_label = Text("Control Unit", font_size=18, color="#ff0040")
        cu_label.next_to(cu_box, UP, buff=0.1)
        
        control_unit = VGroup(cu_box, cu_label)
        
        # Show control unit
        self.play(GrowFromCenter(control_unit), run_time=1.5)
        
        # Animate opcode breakdown - positioned inside the box
        opcode_bits = Text("F7 = 11110111\n4 = 100 (reg)", font_size=12, color="#ff0040")
        opcode_bits.move_to(cu_box.get_center())
        
        self.play(Write(opcode_bits), run_time=2)
        
        # Control signals with proper spacing
        signals = ["MUL_OP", "REG_READ", "ALU_EN"]
        
        signal_texts = VGroup()
        for i, signal in enumerate(signals):
            signal_text = Text(signal, font_size=10, color="#ff0040")
            # Position signals to the right of control unit with proper spacing
            signal_text.move_to(cu_box.get_right() + RIGHT * 1.2 + DOWN * (i * 0.3 - 0.3))
            signal_texts.add(signal_text)
        
        # Animate control signals appearing sequentially
        for signal_text in signal_texts:
            self.play(
                FadeIn(signal_text),
                signal_text.animate.set_stroke("#ff0040", width=2, opacity=0.6),
                run_time=0.6
            )
        
        self.wait(1)
        
        # Clean up title only
        self.play(FadeOut(decode_title), run_time=0.5)
        
        return VGroup(control_unit, opcode_bits, signal_texts)
    
    def setup_alu(self):
        """Create ALU component with proper spacing"""
        # ALU main body - positioned to avoid overlap with registers
        alu_body = Rectangle(width=3.5, height=2.2, color="#00ff80", fill_opacity=0.1)
        alu_body.move_to(RIGHT * 1.5 + DOWN * 0.5)
        
        # ALU label positioned above the box
        alu_label = Text("ALU", font_size=28, color="#00ff80")
        alu_label.next_to(alu_body, UP, buff=0.2)
        
        # ALU symbol (gear) centered in the box
        alu_gear = Text("⚙", font_size=40, color="#00ff80")
        alu_gear.move_to(alu_body.get_center())
        
        alu = VGroup(alu_body, alu_label, alu_gear)
        
        return alu
    
    def operand_fetch(self, ax_reg, bx_reg, alu):
        """Animate operand fetch to ALU with proper spacing"""
        # Show operand fetch title
        fetch_title = Text("Operand Fetch", font_size=32, color="#00bfff")
        fetch_title.to_edge(UP, buff=0.8)
        
        self.play(FadeIn(fetch_title), run_time=1)
        
        # Show ALU
        self.play(GrowFromCenter(alu), run_time=1.5)
        
        # Create data paths from registers to ALU with better spacing
        ax_path = Arrow(
            start=ax_reg.get_right() + RIGHT * 0.1,
            end=alu.get_left() + UP * 0.6 + LEFT * 0.1,
            color="#00bfff",
            stroke_width=4
        )
        
        bx_path = Arrow(
            start=bx_reg.get_right() + RIGHT * 0.1,
            end=alu.get_left() + DOWN * 0.6 + LEFT * 0.1,
            color="#00bfff",
            stroke_width=4
        )
        
        # Animate data paths
        self.play(
            GrowArrow(ax_path),
            GrowArrow(bx_path),
            run_time=1.5
        )
        
        # Highlight source registers
        self.play(
            ax_reg.animate.set_stroke("#00bfff", width=4, opacity=0.8),
            bx_reg.animate.set_stroke("#00bfff", width=4, opacity=0.8),
            run_time=1
        )
        
        # Animate data flowing
        ax_dot = Dot(color="#00bfff").move_to(ax_path.get_start())
        bx_dot = Dot(color="#00bfff").move_to(bx_path.get_start())
        
        self.add(ax_dot, bx_dot)
        
        self.play(
            MoveAlongPath(ax_dot, ax_path),
            MoveAlongPath(bx_dot, bx_path),
            run_time=2
        )
        
        # Show operands in ALU - positioned to avoid overlap
        operand_text = Text("AX: 0xFFFF\nBX: 0xFFFF", font_size=12, color="#00bfff")
        operand_text.move_to(alu.get_center() + DOWN * 1.5)
        
        self.play(FadeIn(operand_text), run_time=1)
        
        # Clean up with proper fade out sequence
        self.play(
            FadeOut(fetch_title),
            FadeOut(ax_dot),
            FadeOut(bx_dot),
            run_time=0.8
        )
        
        self.play(
            FadeOut(ax_path),
            FadeOut(bx_path),
            FadeOut(operand_text),
            ax_reg.animate.set_stroke(width=0),
            bx_reg.animate.set_stroke(width=0),
            run_time=1
        )
    
    def execute_multiplication(self, alu, ax_reg, bx_reg):
        """Animate multiplication execution with proper text spacing"""
        # Show execute title
        exec_title = Text("Execute Multiplication", font_size=32, color="#00ff80")
        exec_title.to_edge(UP, buff=0.8)
        
        self.play(FadeIn(exec_title), run_time=1)
        
        # Highlight ALU
        self.play(
            alu.animate.set_stroke("#00ff80", width=4, opacity=0.8),
            run_time=1
        )
        
        # Animate gear spinning
        gear = alu[2]  # The gear symbol
        self.play(
            Rotate(gear, angle=2*PI, run_time=3),
            rate_func=smooth
        )
        
        # Show calculation with proper spacing below ALU
        calc_text = Text("0x9000 × 0x0003", font_size=22, color="#00ff80")
        calc_text.next_to(alu, DOWN, buff=0.8)
        
        self.play(Write(calc_text), run_time=1.5)
        
        # Show result below calculation
        result_text = Text("= 0x1B200", font_size=22, color="#00ff80")
        result_text.next_to(calc_text, DOWN, buff=0.4)
        
        self.play(Write(result_text), run_time=1.5)
        
        # Show decimal equivalent below result
        decimal_text = Text("(110592 decimal)", font_size=16, color="#80ff80")
        decimal_text.next_to(result_text, DOWN, buff=0.3)
        
        self.play(FadeIn(decimal_text), run_time=1)
        
        self.wait(1.5)
        
        # Clean up all calculation text and reset ALU
        self.play(
            FadeOut(exec_title),
            FadeOut(calc_text),
            FadeOut(result_text),
            FadeOut(decimal_text),
            alu.animate.set_stroke(width=0),
            run_time=1.2
        )
    
    def write_back_results(self, alu, ax_reg, dx_reg):
        """Animate writing results back to registers with proper spacing"""
        # Show write back title
        wb_title = Text("Write Back Results", font_size=32, color="#00bfff")
        wb_title.to_edge(UP, buff=0.8)
        
        self.play(FadeIn(wb_title), run_time=1)
        
        # Create result paths using regular arrows with better spacing
        ax_result_path = Arrow(
            start=alu.get_left() + DOWN * 0.4 + LEFT * 0.1,
            end=ax_reg.get_right() + RIGHT * 0.1,
            color="#00ff80",
            stroke_width=4
        )
        
        dx_result_path = Arrow(
            start=alu.get_left() + DOWN * 0.8 + LEFT * 0.1,
            end=dx_reg.get_right() + RIGHT * 0.1,
            color="#00ff80",
            stroke_width=4
        )
        
        # Show result paths
        self.play(
            GrowArrow(ax_result_path),
            GrowArrow(dx_result_path),
            run_time=1.5
        )
        
        # Animate result flowing
        ax_result_dot = Dot(color="#00ff80").move_to(ax_result_path.get_start())
        dx_result_dot = Dot(color="#00ff80").move_to(dx_result_path.get_start())
        
        self.add(ax_result_dot, dx_result_dot)
        
        self.play(
            MoveAlongPath(ax_result_dot, ax_result_path),
            MoveAlongPath(dx_result_dot, dx_result_path),
            run_time=2
        )
        
        # Update register values with proper sizing - overflow values
        new_ax_value = Text("0x0001", font_size=18, color="#00ff80")
        new_ax_value.move_to(ax_reg[2].get_center())
        
        new_dx_value = Text("0xFFFE", font_size=18, color="#00ff80")
        new_dx_value.move_to(dx_reg[2].get_center())
        
        self.play(
            Transform(ax_reg[2], new_ax_value),
            Transform(dx_reg[2], new_dx_value),
            run_time=1.5
        )
        
        # Highlight updated registers
        self.play(
            ax_reg.animate.set_stroke("#00ff80", width=4, opacity=0.8),
            dx_reg.animate.set_stroke("#00ff80", width=4, opacity=0.8),
            run_time=1
        )
        
        # Show result breakdown - positioned to avoid overlap
        breakdown_text = Text("DX:AX = 0xFFFE:0x0001\n(32-bit overflow result)", 
                            font_size=16, color="#80ff80")
        breakdown_text.move_to(RIGHT * 4 + DOWN * 2.5)
        
        self.play(FadeIn(breakdown_text), run_time=1.5)
        
        self.wait(1)
        
        # Clean up in sequence to avoid overlap
        self.play(
            FadeOut(wb_title),
            FadeOut(ax_result_dot),
            FadeOut(dx_result_dot),
            run_time=0.8
        )
        
        self.play(
            FadeOut(ax_result_path),
            FadeOut(dx_result_path),
            FadeOut(breakdown_text),
            ax_reg.animate.set_stroke(width=0),
            dx_reg.animate.set_stroke(width=0),
            run_time=1
        )
    
    def update_flags(self):
        """Animate flag updates with proper spacing"""
        # Show flags title
        flags_title = Text("Update Status Flags", font_size=32, color="#ffff00")
        flags_title.to_edge(UP, buff=0.8)
        
        self.play(FadeIn(flags_title), run_time=1)
        
        # Create flag indicators with better spacing
        cf_box = Rectangle(width=2, height=1, color="#ffff00", fill_opacity=0.1)
        of_box = Rectangle(width=2, height=1, color="#ffff00", fill_opacity=0.1)
        
        # Position flags on the right side with proper spacing
        cf_box.to_edge(RIGHT, buff=1.5).shift(UP * 1.5)
        of_box.next_to(cf_box, DOWN, buff=0.8)
        
        # Flag labels positioned above boxes
        cf_label = Text("CF (Carry)", font_size=16, color="#ffff00")
        cf_label.next_to(cf_box, UP, buff=0.2)
        cf_value = Text("0", font_size=20, color=WHITE)
        cf_value.move_to(cf_box.get_center())
        
        of_label = Text("OF (Overflow)", font_size=16, color="#ffff00")
        of_label.next_to(of_box, UP, buff=0.2)
        of_value = Text("0", font_size=20, color=WHITE)
        of_value.move_to(of_box.get_center())
        
        cf_flag = VGroup(cf_box, cf_label, cf_value)
        of_flag = VGroup(of_box, of_label, of_value)
        
        # Show flags
        self.play(
            GrowFromCenter(cf_flag),
            GrowFromCenter(of_flag),
            run_time=1.5
        )
        
        # Flash flags to indicate update
        for _ in range(2):  # Reduced flashing to avoid visual clutter
            self.play(
                cf_flag.animate.set_stroke("#ffff00", width=4, opacity=0.8),
                of_flag.animate.set_stroke("#ffff00", width=4, opacity=0.8),
                run_time=0.4
            )
            self.play(
                cf_flag.animate.set_stroke(width=0),
                of_flag.animate.set_stroke(width=0),
                run_time=0.4
            )
        
        # Explanation positioned to avoid overlap
        flag_explanation = Text("CF=0, OF=0: Result fits in 16 bits", 
                              font_size=16, color="#ffff80")
        flag_explanation.to_edge(DOWN, buff=1.2)
        
        self.play(FadeIn(flag_explanation), run_time=1.5)
        
        self.wait(1)
        
        # Clean up
        self.play(
            FadeOut(flags_title),
            FadeOut(cf_flag),
            FadeOut(of_flag),
            FadeOut(flag_explanation),
            run_time=1.2
        )
    
    def final_summary(self, ax_reg, dx_reg):
        """Show final summary of the operation with proper spacing"""
        # Clear screen first to avoid overlap
        self.clear()
        
        # Re-add the final register states
        self.add(ax_reg, dx_reg)
        
        # Final title with proper positioning
        final_title = Text("Execution Complete", font_size=42, color="#00ff80")
        final_title.move_to(ORIGIN).shift(UP * 3)
        
        # Summary text with better line spacing and positioning
        summary = Text(
            "MUL BX Instruction Executed Successfully\n\n"
            "Original Values:\n"
            "AX = 0x9000 (36864 decimal)\n"
            "BX = 0x0003 (3 decimal)\n\n"
            "Final Result:\n"
            "DX:AX = 0x0001:0xB200\n"
            "= 110592 decimal",
            font_size=20,
            color=WHITE,
            line_spacing=1.4
        )
        summary.next_to(final_title, DOWN, buff=1)
        
        # Position registers to the sides for final display
        ax_reg.to_edge(LEFT, buff=2).shift(DOWN * 1)
        dx_reg.next_to(ax_reg, DOWN, buff=0.5)
        
        # Animate final summary
        self.play(
            FadeIn(final_title),
            run_time=2
        )
        
        self.play(
            Write(summary),
            run_time=3
        )
        
        # Final highlight of result registers
        self.play(
            ax_reg.animate.set_stroke("#00ff80", width=6, opacity=1),
            dx_reg.animate.set_stroke("#00ff80", width=6, opacity=1),
            run_time=2
        )
        
        # Hold final frame
        self.wait(3)
    
    def setup_memory_and_pc_detailed(self):
        """Enhanced memory and PC setup with detailed explanations"""
        # Clear previous elements but keep registers
        self.remove(*[obj for obj in self.mobjects if not isinstance(obj, VGroup) or len(obj) < 3])
        
        return self.setup_memory_and_pc()
    
    def instruction_fetch_detailed(self, memory_cell, pc_arrow, ir_reg):
        """Enhanced instruction fetch with step explanations"""
        # Clear any overlapping elements except registers
        stage_elements = [obj for obj in self.mobjects if hasattr(obj, 'get_center') and obj.get_center()[0] > 2]
        if stage_elements:
            self.remove(*stage_elements)
        
        return self.instruction_fetch(memory_cell, pc_arrow, ir_reg)
    
    def decode_instruction_detailed(self, ir_reg):
        """Enhanced decode with microcode explanation"""
        # Clear previous stage elements but keep essential components
        self.remove(*[obj for obj in self.mobjects if hasattr(obj, 'font_size') and getattr(obj, 'font_size', 0) > 30])
        
        return self.decode_instruction(ir_reg)
    
    def setup_alu_detailed(self):
        """Enhanced ALU setup with internal structure"""
        # Clear previous elements but preserve registers and essential components
        to_remove = [obj for obj in self.mobjects if hasattr(obj, 'get_center') and obj.get_center()[1] > 1.5 and obj.get_center()[0] > 1]
        if to_remove:
            self.remove(*to_remove)
        
        return self.setup_alu()
    
    def operand_fetch_detailed(self, ax_reg, bx_reg, alu):
        """Enhanced operand fetch with data path explanation"""
        # Clear any overlapping text or temporary elements
        temp_elements = [obj for obj in self.mobjects if hasattr(obj, 'font_size') and getattr(obj, 'font_size', 0) < 20]
        if temp_elements:
            self.remove(*temp_elements)
        
        return self.operand_fetch(ax_reg, bx_reg, alu)
    
    def execute_multiplication_detailed(self, alu, ax_reg, bx_reg):
        """Enhanced multiplication with bit-level operations"""
        # Clear overlapping elements first
        self.remove(*[obj for obj in self.mobjects if hasattr(obj, 'font_size') and getattr(obj, 'font_size', 0) > 20 and obj.get_center()[1] > 2])
        
        # Show execute title
        exec_title = Text("Execute Multiplication", font_size=36, color="#00ff80")
        exec_title.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(exec_title), run_time=1)
        
        # Highlight ALU
        self.play(
            alu.animate.set_stroke("#00ff80", width=4, opacity=0.8),
            run_time=1
        )
        
        # Show detailed multiplication process
        multiplication_steps = Text(
            "Multiplication Algorithm:\n"
            "1. Initialize result = 0\n"
            "2. For each bit in multiplier:\n"
            "   - If bit = 1, add multiplicand\n"
            "   - Shift multiplicand left\n"
            "3. Store 32-bit result in DX:AX",
            font_size=14, color="#80ff80", line_spacing=1.1
        )
        multiplication_steps.move_to(RIGHT * 5 + UP * 0.5)
        
        self.play(FadeIn(multiplication_steps), run_time=2)
        self.wait(2)
        
        # Animate gear spinning
        gear = alu[2]  # The gear symbol
        self.play(
            Rotate(gear, angle=4*PI, run_time=4),  # Longer rotation
            rate_func=smooth
        )
        
        # Show step-by-step calculation
        calc_steps = [
            "Step 1: 0xFFFF × 0xFFFF = 0xFFFE0001",
            "Result: 4,294,836,225 decimal", 
            "Overflow: Result > 16-bit maximum"
        ]
        
        step_group = VGroup()
        for i, step in enumerate(calc_steps):
            step_text = Text(step, font_size=14, color="#00ff80")
            step_text.move_to(alu.get_center() + DOWN * (1.5 + i * 0.4))
            step_group.add(step_text)
        
        for step_text in step_group:
            self.play(FadeIn(step_text), run_time=1)
            self.wait(0.5)
        
        # Show final result
        result_text = Text("Final Result: DX:AX = 0xFFFE:0x0001", 
                          font_size=18, color="#00ff80")
        result_text.next_to(step_group, DOWN, buff=0.5)
        
        self.play(FadeIn(result_text), run_time=1.5)
        self.wait(2)
        
        # Clean up
        self.play(
            FadeOut(exec_title),
            FadeOut(multiplication_steps),
            FadeOut(step_group),
            FadeOut(result_text),
            alu.animate.set_stroke(width=0),
            run_time=2
        )
    
    def write_back_results_detailed(self, alu, ax_reg, dx_reg):
        """Enhanced write back with detailed register updates"""
        # Clear calculation steps and temporary elements
        temp_elements = [obj for obj in self.mobjects if hasattr(obj, 'font_size') and getattr(obj, 'font_size', 0) < 20]
        if temp_elements:
            self.remove(*temp_elements)
        
        return self.write_back_results(alu, ax_reg, dx_reg)
    
    def update_flags_detailed(self):
        """Enhanced flags update with condition explanations"""
        # Clear previous calculation elements
        self.remove(*[obj for obj in self.mobjects if hasattr(obj, 'get_center') and obj.get_center()[1] < -1])
        
        # Show flags title
        flags_title = Text("Update Status Flags", font_size=36, color="#ffff00")
        flags_title.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(flags_title), run_time=1)
        
        # Create flag indicators with better spacing - non-overlapping layout
        cf_box = Rectangle(width=1.8, height=0.8, color="#ffff00", fill_opacity=0.1)
        of_box = Rectangle(width=1.8, height=0.8, color="#ffff00", fill_opacity=0.1)
        sf_box = Rectangle(width=1.8, height=0.8, color="#ffff00", fill_opacity=0.1)
        zf_box = Rectangle(width=1.8, height=0.8, color="#ffff00", fill_opacity=0.1)
        
        # Position flags in a single row to avoid overlap
        cf_box.move_to(RIGHT * 1 + DOWN * 0.5)
        of_box.next_to(cf_box, RIGHT, buff=0.3)
        sf_box.next_to(of_box, RIGHT, buff=0.3)
        zf_box.next_to(sf_box, RIGHT, buff=0.3)
        
        # Flag labels and values
        cf_label = Text("CF", font_size=16, color="#ffff00")
        cf_label.next_to(cf_box, UP, buff=0.05)
        cf_value = Text("1", font_size=18, color=WHITE)  # Set to 1 for overflow
        cf_value.move_to(cf_box.get_center())
        
        of_label = Text("OF", font_size=16, color="#ffff00")
        of_label.next_to(of_box, UP, buff=0.05)
        of_value = Text("1", font_size=18, color=WHITE)  # Set to 1 for overflow
        of_value.move_to(of_box.get_center())
        
        sf_label = Text("SF", font_size=16, color="#ffff00")
        sf_label.next_to(sf_box, UP, buff=0.05)
        sf_value = Text("0", font_size=18, color=WHITE)
        sf_value.move_to(sf_box.get_center())
        
        zf_label = Text("ZF", font_size=16, color="#ffff00")
        zf_label.next_to(zf_box, UP, buff=0.05)
        zf_value = Text("0", font_size=18, color=WHITE)
        zf_value.move_to(zf_box.get_center())
        
        # Group flags
        cf_flag = VGroup(cf_box, cf_label, cf_value)
        of_flag = VGroup(of_box, of_label, of_value)
        sf_flag = VGroup(sf_box, sf_label, sf_value)
        zf_flag = VGroup(zf_box, zf_label, zf_value)
        
        # Show flags with staggered animation
        self.play(GrowFromCenter(cf_flag), run_time=1)
        self.play(GrowFromCenter(of_flag), run_time=1)
        self.play(GrowFromCenter(sf_flag), run_time=1)
        self.play(GrowFromCenter(zf_flag), run_time=1)
        
        # Detailed explanation
        flag_explanation = Text(
            "Flag Conditions for MUL:\n"
            "CF=1, OF=1: Overflow occurred (result ≥ 65536)\n"
            "SF=0: Result is positive\n"
            "ZF=0: Result is not zero",
            font_size=12, color="#ffff80", line_spacing=1.1
        )
        flag_explanation.move_to(LEFT * 2 + DOWN * 2)
        
        self.play(FadeIn(flag_explanation), run_time=2)
        self.wait(3)
        
        # Flash flags to indicate update
        for _ in range(2):
            self.play(
                cf_flag.animate.set_stroke("#ffff00", width=4, opacity=0.8),
                of_flag.animate.set_stroke("#ffff00", width=4, opacity=0.8),
                sf_flag.animate.set_stroke("#ffff00", width=4, opacity=0.8),
                zf_flag.animate.set_stroke("#ffff00", width=4, opacity=0.8),
                run_time=0.5
            )
            self.play(
                cf_flag.animate.set_stroke(width=0),
                of_flag.animate.set_stroke(width=0),
                sf_flag.animate.set_stroke(width=0),
                zf_flag.animate.set_stroke(width=0),
                run_time=0.5
            )
        
        self.wait(2)
        
        # Clean up
        self.play(
            FadeOut(flags_title),
            FadeOut(cf_flag),
            FadeOut(of_flag),
            FadeOut(sf_flag),
            FadeOut(zf_flag),
            FadeOut(flag_explanation),
            run_time=2
        )
    
    def performance_analysis(self):
        """Show performance analysis of the MUL instruction"""
        # Clear all previous elements except registers
        elements_to_keep = [obj for obj in self.mobjects if hasattr(obj, 'get_center') and obj.get_center()[0] < -1]
        self.clear()
        if elements_to_keep:
            self.add(*elements_to_keep)
        
        perf_title = Text("Performance Analysis", font_size=42, color="#ff8080")
        perf_title.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(perf_title), run_time=1.5)
        
        # Performance metrics
        metrics = Text(
            "8086 MUL Instruction Performance:\n\n"
            "Clock Cycles: 70-77 cycles\n"
            "Execution Time: 14-15.4 μs @ 5MHz\n"
            "Memory Access: 2 reads, 0 writes\n"
            "Register Updates: AX, DX, Flags\n\n"
            "Comparison with Modern CPUs:\n"
            "Modern x86: 1-3 cycles\n"
            "Speedup Factor: 25-75x faster!",
            font_size=18, color="#ff8080", line_spacing=1.3
        )
        metrics.move_to(LEFT * 2)
        
        self.play(FadeIn(metrics), run_time=3)
        self.wait(4)
        
        # Show timing diagram
        timing_title = Text("Instruction Timing", font_size=18, color="#ffff00")
        timing_title.move_to(RIGHT * 4 + UP * 2)
        
        timing_bars = VGroup()
        stages = ["Fetch", "Decode", "Execute", "Flags"]
        cycles = [4, 3, 70, 2]
        
        for i, (stage, cycle) in enumerate(zip(stages, cycles)):
            bar = Rectangle(
                width=cycle/10, height=0.3, 
                color="#80ff80", fill_opacity=0.7
            )
            bar.move_to(RIGHT * 4 + UP * (1.5 - i * 0.35))
            
            stage_label = Text(stage, font_size=14, color=WHITE)
            stage_label.next_to(bar, LEFT, buff=0.3)
            
            cycle_label = Text(f"{cycle}", font_size=12, color="#80ff80")
            cycle_label.next_to(bar, RIGHT, buff=0.1)
            
            timing_bars.add(bar, stage_label, cycle_label)
        
        self.play(FadeIn(timing_title), run_time=1)
        self.play(FadeIn(timing_bars), run_time=2)
        self.wait(3)
        
        # Clean up
        self.play(
            FadeOut(perf_title),
            FadeOut(metrics),
            FadeOut(timing_title),
            FadeOut(timing_bars),
            run_time=2
        )
    
    def final_summary_extended(self, ax_reg, dx_reg):
        """Extended final summary with comprehensive recap"""
        # Clear everything except registers for final summary
        self.clear()
        
        # Re-add registers in final positions
        ax_reg.move_to(LEFT * 5 + UP * 1)
        dx_reg.move_to(LEFT * 5 + DOWN * 0.5)
        self.add(ax_reg, dx_reg)
        
        # Final title
        final_title = Text("Execution Complete", font_size=48, color="#00ff80")
        final_title.move_to(ORIGIN + UP * 3.2)
        
        # Comprehensive summary
        summary = Text(
            "8086 MUL BX Instruction - Complete Execution Summary\n\n"
            "Initial State:\n"
            "  • AX (Accumulator) = 0xFFFF (65,535 decimal)\n"
            "  • BX (Base) = 0xFFFF (65,535 decimal)\n"
            "  • DX (Data) = 0x0000\n\n"
            "Final Result:\n"
            "  • DX:AX = 0xFFFE:0x0001 (4,294,836,225 decimal)\n"
            "  • Mathematical verification: 65,535 × 65,535 = 4,294,836,225 ✓\n"
            "  • Overflow occurred: CF=1, OF=1\n\n"
            "CPU Cycle Summary:\n"
            "  • Total execution time: ~77 clock cycles\n"
            "  • Flags updated: CF=1, OF=1, SF=0, ZF=0\n"
            "  • Memory accesses: 2 instruction fetches",
            font_size=12, color=WHITE, line_spacing=1.1
        )
        summary.move_to(RIGHT * 1.5 + DOWN * 0.5)
        
        # Animate final summary
        self.play(FadeIn(final_title), run_time=2)
        self.wait(1)
        
        self.play(Write(summary), run_time=4)
        self.wait(1)
        
        # Final highlight of result registers
        self.play(
            ax_reg.animate.set_stroke("#00ff80", width=6, opacity=1),
            dx_reg.animate.set_stroke("#00ff80", width=6, opacity=1),
            run_time=2
        )
        
        # Thank you message
        thank_you = Text("Thank You for Watching!", font_size=28, color="#00bfff")
        thank_you.move_to(DOWN * 3.2)
        
        self.play(FadeIn(thank_you), run_time=2)
        
        # Hold final frame longer
        self.wait(5)