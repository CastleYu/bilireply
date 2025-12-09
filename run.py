import html
import sys
import re
import os
import subprocess  # 新增：用于调用系统命令 taskkill
import ctypes  # 新增：用于隐藏控制台窗口
from pathlib import Path
from PyQt6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                             QTextEdit, QSystemTrayIcon, QMenu, QMessageBox, QLabel)
from PyQt6.QtCore import QProcess, QUrl, Qt, QSize
from PyQt6.QtGui import QIcon, QAction, QDesktopServices, QColor, QPixmap


class ViteLauncher(QWidget):
    def __init__(self):
        super().__init__()
        self.process = None
        self.project_path = os.getcwd()  # 默认当前目录
        self.port = 5173  # Vite 默认端口
        self.console_visible = True  # 记录控制台可见状态

        # 初始化 UI
        self.init_ui()
        self.init_tray()

        # 启动后默认隐藏控制台
        self.toggle_console(force_hide=True)

        # 尝试读取端口
        self.detect_vite_port()

    def toggle_console(self, checked=False, force_hide=False):
        """
        切换控制台窗口的显示/隐藏状态 (仅限 Windows)
        :param checked: 按钮点击信号自带参数，忽略
        :param force_hide: 是否强制隐藏
        """
        if sys.platform != "win32":
            return

        # 获取控制台窗口句柄
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd == 0:
            return

        # 确定目标状态
        if force_hide:
            target_state = False
        else:
            target_state = not self.console_visible

        # User32.ShowWindow(hwnd, nCmdShow)
        # 0 = SW_HIDE (隐藏)
        # 5 = SW_SHOW (显示)
        ctypes.windll.user32.ShowWindow(hwnd, 5 if target_state else 0)

        self.console_visible = target_state

        # 更新按钮文字
        if hasattr(self, 'btn_console'):
            new_text = "🙈 隐藏控制台" if self.console_visible else "👁️ 显示控制台"
            self.btn_console.setText(new_text)

    def init_ui(self):
        self.setWindowTitle("Vite 项目管理器")
        self.resize(600, 450)

        # --- 图标配置 ---
        # 这里动态生成一个紫色图标（Vite 主题色）
        # 如果有本地文件，可以使用: icon = QIcon("path/to/icon.ico")
        icon_pixmap = QPixmap(32, 32)
        icon_pixmap.fill(QColor("#646cff"))
        self.setWindowIcon(QIcon(icon_pixmap))

        layout = QVBoxLayout()

        # 状态显示
        self.status_label = QLabel(f"目标项目: {self.project_path}")
        self.status_label.setStyleSheet("font-weight: bold; margin-bottom: 5px;")
        layout.addWidget(self.status_label)

        # --- 第一排按钮：服务控制 ---
        server_layout = QHBoxLayout()

        self.btn_start = QPushButton("▶ 启动服务 (npm run dev)")
        self.btn_start.setMinimumHeight(35)
        self.btn_start.clicked.connect(self.start_server)
        server_layout.addWidget(self.btn_start)

        self.btn_stop = QPushButton("⏹ 停止服务")
        self.btn_stop.setMinimumHeight(35)
        self.btn_stop.setEnabled(False)
        self.btn_stop.clicked.connect(self.stop_server)
        server_layout.addWidget(self.btn_stop)

        layout.addLayout(server_layout)

        # --- 第二排按钮：常用工具 ---
        utils_layout = QHBoxLayout()

        self.btn_browser = QPushButton("🌐 打开浏览器")
        self.btn_browser.setMinimumHeight(35)
        self.btn_browser.setToolTip("手动打开 http://localhost:PORT")
        self.btn_browser.clicked.connect(self.open_browser)
        utils_layout.addWidget(self.btn_browser)

        # 新增：控制台显示/隐藏按钮
        self.btn_console = QPushButton("👁️ 显示控制台")
        self.btn_console.setMinimumHeight(35)
        self.btn_console.setToolTip("显示或隐藏后台 CMD 窗口")
        self.btn_console.clicked.connect(self.toggle_console)
        utils_layout.addWidget(self.btn_console)

        self.btn_exit = QPushButton("❌ 直接退出程序")
        self.btn_exit.setMinimumHeight(35)
        self.btn_exit.setToolTip("完全退出应用，不最小化到托盘")
        self.btn_exit.setStyleSheet("color: #ff5555;")  # 红色文字提示
        self.btn_exit.clicked.connect(self.quit_app)
        utils_layout.addWidget(self.btn_exit)

        layout.addLayout(utils_layout)

        # 日志显示区
        self.log_output = QTextEdit()
        self.log_output.setReadOnly(True)
        # 优化样式，增加行间距
        self.log_output.setStyleSheet("""
                        QTextEdit {
                            background-color: #1e1e1e; 
                            color: #d4d4d4; 
                            font-family: 'Consolas', 'Courier New', monospace;
                            font-size: 12px;
                            border: none;
                            padding: 5px;
                        }
                    """)
        layout.addWidget(self.log_output)

        self.setLayout(layout)

    def init_tray(self):
        """初始化系统托盘"""
        self.tray_icon = QSystemTrayIcon(self)

        # 创建一个简单的颜色图标作为托盘图标
        pixmap = QPixmap(16, 16)
        pixmap.fill(QColor("green"))
        icon = QIcon(pixmap)
        self.tray_icon.setIcon(icon)

        # 托盘菜单
        tray_menu = QMenu()

        action_show = QAction("显示窗口", self)
        action_show.triggered.connect(self.show_normal_window)
        tray_menu.addAction(action_show)

        action_quit = QAction("退出程序", self)
        action_quit.triggered.connect(self.quit_app)
        tray_menu.addAction(action_quit)

        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.on_tray_click)
        self.tray_icon.show()

    def detect_vite_port(self):
        """
        使用正则从 vite.config.ts 中读取端口。
        """
        config_path = Path(self.project_path) / "vite.config.ts"
        if not config_path.exists():
            # 尝试找 js 版本
            config_path = Path(self.project_path) / "vite.config.js"

        if config_path.exists():
            # 这里按照要求不使用 try-except，让错误直接暴露或由外部处理
            # 但为了保持原代码逻辑结构一致性，如果文件读取失败可能会崩溃，
            # 实际生产代码应处理 PermissionError 等
            content = config_path.read_text(encoding='utf-8')
            match = re.search(r'port:\s*(\d+)', content)
            if match:
                self.port = int(match.group(1))
                self.append_log(f"🔍 从配置文件检测到端口: {self.port}")
            else:
                self.append_log(f"⚠️ 未在配置中找到明确端口，使用默认: {self.port}")
        else:
            self.append_log("⚠️ 未找到 vite.config.ts/js，使用默认设置。")

    def start_server(self):
        if self.process and self.process.state() != QProcess.ProcessState.NotRunning:
            return

        self.process = QProcess()
        self.process.setWorkingDirectory(self.project_path)

        # 设定程序
        if sys.platform == "win32":
            program = "npm.cmd"
        else:
            program = "npm"

        self.process.setProgram(program)
        self.process.setArguments(["run", "dev"])

        # 信号连接
        self.process.readyReadStandardOutput.connect(self.handle_stdout)
        self.process.readyReadStandardError.connect(self.handle_stderr)
        self.process.finished.connect(self.process_finished)

        self.process.start()

        self.btn_start.setEnabled(False)
        self.btn_stop.setEnabled(True)
        self.append_log("🚀 正在启动服务...")

    def stop_server(self):
        """
        停止服务，包含针对 Windows 进程树的特殊处理
        """
        if self.process and self.process.state() != QProcess.ProcessState.NotRunning:
            self.append_log("🛑 正在停止服务...")

            # 获取进程 ID
            pid = self.process.processId()

            # 针对 Windows 的特殊处理：杀死进程树
            if sys.platform == "win32":
                # /F: 强制终止
                # /T: 终止指定的进程和由它启用的子进程 (Tree kill)
                # /PID: 进程 ID
                # subprocess.run 是同步调用，确保在 kill 之前执行
                subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, stdout=subprocess.DEVNULL,
                               stderr=subprocess.DEVNULL)

            # 标准 Qt kill (对非 Windows 或作为兜底)
            self.process.kill()
            self.process.waitForFinished()

    def open_browser(self):
        """主动打开浏览器"""
        url = f"http://localhost:{self.port}"
        # 记录日志
        self.append_log(f"🔗 用户手动请求打开: <a href='{url}' style='color:white'>{url}</a>", is_html=True)
        QDesktopServices.openUrl(QUrl(url))

    def ansi_to_html(self, text):
        """
        将包含 ANSI 颜色代码的文本转换为 HTML 格式
        """
        text = html.escape(text)
        text = text.replace('\n', '<br>')

        ansi_patterns = [
            (r'\x1b\[31m', '<span style="color:#ff5555">'),  # 红
            (r'\x1b\[32m', '<span style="color:#50fa7b">'),  # 绿
            (r'\x1b\[33m', '<span style="color:#f1fa8c">'),  # 黄
            (r'\x1b\[34m', '<span style="color:#bd93f9">'),  # 蓝
            (r'\x1b\[35m', '<span style="color:#ff79c6">'),  # 紫
            (r'\x1b\[36m', '<span style="color:#8be9fd">'),  # 青
            (r'\x1b\[1m', '<span style="font-weight:bold">'),  # 加粗
            (r'\x1b\[2m', '<span style="opacity:0.6">'),  # 变暗
            (r'\x1b\[0m', '</span>'),  # 重置
            (r'\x1b\[\d+;32m', '<span style="color:#50fa7b; font-weight:bold">'),
            (r'\x1b\[\d+;36m', '<span style="color:#8be9fd; font-weight:bold">'),
        ]

        for pattern, replacement in ansi_patterns:
            text = re.sub(pattern, replacement, text)

        text = re.sub(r'\x1b\[[0-9;]*m', '', text)
        return text

    def handle_stdout(self):
        data = self.process.readAllStandardOutput()
        raw_text = bytes(data).decode('utf-8', errors='ignore')

        clean_text = re.sub(r'\x1b\[[0-9;]*m', '', raw_text)

        # 自动打开浏览器逻辑
        url_match = re.search(r'(http://(?:localhost|127\.0\.0\.1):\d+)', clean_text)
        if url_match and not getattr(self, '_browser_opened', False):
            real_url = url_match.group(1)
            self._browser_opened = True
            self.append_log(
                f'<br><b>🌍 检测到服务地址，正在打开: <a href="{real_url}" style="color:white">{real_url}</a></b><br>',
                is_html=True)
            QDesktopServices.openUrl(QUrl(real_url))

        html_content = self.ansi_to_html(raw_text)
        self.append_log(html_content, is_html=True)

    def handle_stderr(self):
        data = self.process.readAllStandardError()
        raw_text = bytes(data).decode('utf-8', errors='ignore')
        html_err = f'<span style="color:#ff5555">{html.escape(raw_text)}</span>'.replace('\n', '<br>')
        self.append_log(html_err, is_html=True)

    def append_log(self, content, is_html=False):
        cursor = self.log_output.textCursor()
        cursor.movePosition(cursor.MoveOperation.End)

        if is_html:
            cursor.insertHtml(content)
        else:
            cursor.insertText(content)

        self.log_output.setTextCursor(cursor)
        self.log_output.ensureCursorVisible()

    def process_finished(self):
        self.btn_start.setEnabled(True)
        self.btn_stop.setEnabled(False)
        self._browser_opened = False
        self.append_log("\n🏁 进程已结束。")

    def closeEvent(self, event):
        """重写关闭事件：不退出，而是隐藏到托盘"""
        if self.tray_icon.isVisible():
            self.hide()
            self.tray_icon.showMessage(
                "Vite 管理器",
                "程序已最小化到托盘运行",
                QSystemTrayIcon.MessageIcon.Information,
                2000
            )
            event.ignore()
        else:
            event.accept()

    def show_normal_window(self):
        self.show()
        self.setWindowState(Qt.WindowState.WindowNoState)
        self.activateWindow()

    def on_tray_click(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            self.show_normal_window()

    def quit_app(self):
        """完全退出"""
        # 在退出前必须调用 stop_server 以清理进程树
        self.stop_server()
        QApplication.quit()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    window = ViteLauncher()
    window.show()

    sys.exit(app.exec())
