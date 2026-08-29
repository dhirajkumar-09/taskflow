import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowUpRight,
  Mail,
  Upload,
  ArrowUp,
  Sparkles,
  BadgeCheck,
  Pencil,
  Check,
  Trash2,
  Plus,
  X,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Link as LinkIcon,
  PlayCircle,
  ExternalLink,
  Code2,
  Activity,
  Calendar,
  ShieldCheck,
  Send,
  MessageSquare
} from "lucide-react";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, collection, addDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from "firebase/auth";

const LinkedinIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const Github = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.755-1.333-1.755-1.089-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.873.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const firebaseConfig = {
  apiKey: "AIzaSyCBMHoaPc0aGZ4MV18zkDZd5c4-tWSRXl0",
  authDomain: "dhiraj-portfolio-09.firebaseapp.com",
  projectId: "dhiraj-portfolio-09",
  storageBucket: "dhiraj-portfolio-09.firebasestorage.app",
  messagingSenderId: "749904624186",
  appId: "1:749904624186:web:8738bf7931636d46481303",
  measurementId: "G-DN3GZZDHJV"
};

const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app, db, auth;
try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const ADMIN_EMAIL = "dhidna9090@gmail.com"; 
const APP_ID = "my_portfolio_v1";

const DEFAULT_PROFILE = {
  name: "Dhiraj Kumar",
  role: "Full-Stack Engineer",
  focus: "Systems · Interfaces · Infrastructure",
  headline: "I build software that",
  headlineAccent: "earns trust.",
  intro: "Six years designing and shipping products end to end — from database schema to the pixel a user taps. Selected work, credentials, and how to reach me, below.",
  email: "dhidna9090@gmail.com",
  linkedin: "https://www.linkedin.com/in/dhiraj-kumar-01b185350?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  github: "https://github.com/dhirajkumar-09/My-Portfolio",
  stats: [
    { k: "Years experience", v: "06" },
    { k: "Projects shipped", v: "24" },
    { k: "Certifications", v: "09" },
  ],
};

const DEFAULT_PROJECTS = [
  {
    title: "Ledgerline",
    subtitle: "Expense Automation Platform",
    desc: "A reconciliation engine that ingests bank feeds and receipts, then auto-categorizes spend for small teams. Cut manual bookkeeping time by 70% for pilot customers.",
    stack: ["React", "Node.js", "PostgreSQL", "AWS Lambda"],
    live: "#",
    source: "#",
    linkedin: "#",
    image: null,
    video: "",
  }
];

const DEFAULT_CERTIFICATES = [
  { 
    seal: "AWS", 
    title: "AWS Certified Solutions Architect", 
    issuer: "Amazon Web Services", 
    date: "2025",
    desc: "Architecting secure, highly available, and scalable systems on AWS.",
    verifyUrl: "https://aws.amazon.com/verification",
    image: null
  }
];

const DEFAULT_SKILLS = [
  { label: "Languages", items: ["TypeScript", "Python", "Go", "SQL", "Rust"] },
  { label: "Frameworks & Platforms", items: ["React", "Next.js", "Node.js", "Docker", "Kubernetes"] },
];

const DEFAULT_ACTIVITY_LOGS = [
  { date: "August 2026", title: "Portfolio V2 Launched", desc: "Designed and engineered a new portfolio with React, Firebase real-time CMS, and custom animations." },
  { date: "July 2026", title: "Ledgerline Beta Release", desc: "Successfully onboarded the first pilot users to the expense automation platform." },
  { date: "March 2026", title: "AWS Certification", desc: "Earned the AWS Certified Solutions Architect credential." }
];

const NAV = [
  { id: "work", label: "Work" },
  { id: "certificates", label: "Certificates" },
  { id: "skills", label: "Toolkit" },
  { id: "activity", label: "Activity" },
  { id: "contact", label: "Contact" },
];

const emptyProject = () => ({ title: "New Project", subtitle: "Short subtitle", desc: "Describe what it does and the impact it had.", stack: ["Tech"], live: "#", source: "#", linkedin: "#", image: null, video: "" });
const emptyCert = () => ({ seal: "NEW", title: "Certificate name", issuer: "Issuing organization", date: "2026", desc: "Brief description of the certification.", verifyUrl: "#", image: null });
const emptyLog = () => ({ date: "New Date", title: "New Milestone", desc: "Describe what happened." });

const compressImage = (file, maxWidth = 500, quality = 0.55) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const getApproxSizeKB = (obj) => {
  try {
    return Math.round(new Blob([JSON.stringify(obj)]).size / 1024);
  } catch {
    return 0;
  }
};

const GREETINGS = [
  "Hello", 
  "नमस्ते", 
  "Hola", 
  "Bonjour", 
  "Ciao", 
  "Konnichiwa", 
  "Merhaba", 
  "Welcome",
  "DHIRAJ KUMAR"
];

const IntroScreen = React.memo(({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let timeout;
    if (isExiting) return;

    if (index < GREETINGS.length - 1) {
      timeout = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 400); 
    } else {
      timeout = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onComplete, 1200); 
      }, 1500); 
    }
    return () => clearTimeout(timeout);
  }, [index, isExiting, onComplete]);

  const isFinalName = index === GREETINGS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#05070A] transition-all duration-[1200ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? "-translate-y-full rounded-b-[150px] opacity-90 shadow-2xl" : "translate-y-0 rounded-b-none opacity-100"
      }`}
    >
      <div className="flex items-center gap-4 md:gap-6 text-[var(--text)] font-display text-4xl md:text-5xl lg:text-7xl relative z-10 transition-transform duration-500">
        {!isFinalName && <span className="w-2.5 h-2.5 md:w-4 md:h-4 rounded-full bg-[var(--gold-bright)] animate-pulse" />}
        <h2 className={isFinalName ? "final-intro-text tracking-tight font-medium" : "animate-intro-text"}>
          {GREETINGS[index]}
        </h2>
      </div>
      {isFinalName && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--gold-bright)_0%,_transparent_40%)] opacity-20 mix-blend-screen animate-pulse-slow"></div>
      )}
    </div>
  );
});

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [delayedMousePos, setDelayedMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const mousePosRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    
    let animationFrameId;
    const render = () => {
      setDelayedMousePos((prev) => {
        const dx = mousePosRef.current.x - prev.x;
        const dy = mousePosRef.current.y - prev.y;
        return { x: prev.x + dx * 0.2, y: prev.y + dy * 0.2 };
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.tagName?.toLowerCase() === 'button' || target.tagName?.toLowerCase() === 'a' || target.closest?.('button') || target.closest?.('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener("mouseover", handleMouseOver);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div 
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-[var(--gold-bright)] rounded-full pointer-events-none mix-blend-difference z-[9999]"
        style={{ transform: `translate3d(${mousePos.x - 5}px, ${mousePos.y - 5}px, 0) scale(${isHovering ? 0 : 1})`, transition: 'transform 0.1s ease-out' }}
      />
      <div 
        className="fixed top-0 left-0 w-12 h-12 border border-[var(--gold-bright)]/50 rounded-full pointer-events-none z-[9998] flex items-center justify-center backdrop-blur-[2px]"
        style={{ 
          transform: `translate3d(${delayedMousePos.x - 24}px, ${delayedMousePos.y - 24}px, 0) scale(${isHovering ? 1.4 : 1})`, 
          backgroundColor: isHovering ? 'rgba(212,175,106,0.15)' : 'transparent',
          transition: 'transform 0.05s linear, background-color 0.3s ease, border-color 0.3s ease',
          borderColor: isHovering ? 'var(--gold-bright)' : 'rgba(212,175,106,0.4)'
        }}
      >
        <div className={`w-1.5 h-1.5 bg-[var(--gold-bright)] rounded-full transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </>
  );
};

export default function Portfolio() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [certificates, setCertificates] = useState(DEFAULT_CERTIFICATES);
  const [skillGroups, setSkillGroups] = useState(DEFAULT_SKILLS);
  const [activityLogs, setActivityLogs] = useState(DEFAULT_ACTIVITY_LOGS);

  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  
  // Messaging Form State
  const [msgForm, setMsgForm] = useState({ name: "", email: "", message: "" });
  const [sendingMsg, setSendingMsg] = useState(false);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const isAdminUser = user && user.email === ADMIN_EMAIL;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const forceBlurBeforeClick = (e) => {
      const active = document.activeElement;
      if (
        active &&
        active !== e.target &&
        active.getAttribute &&
        active.getAttribute("contenteditable") === "true" &&
        !active.contains(e.target)
      ) {
        active.blur();
      }
    };
    document.addEventListener("mousedown", forceBlurBeforeClick, true);
    return () => document.removeEventListener("mousedown", forceBlurBeforeClick, true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    
    if (!loading && !showIntro) {
      setTimeout(() => {
        document.querySelectorAll(".reveal-up, .reveal-scale, .reveal-left, .reveal-right, .reveal-rotate").forEach((el) => observer.observe(el));
      }, 300);
    }
    
    return () => observer.disconnect();
  }, [projects.length, certificates.length, loading, showIntro]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setTimeout(() => setLoading(false), 500); 
      return;
    }

    if (!auth || !db) {
      setLoading(false);
      return;
    }

    // FIXED: Ensured visitors log in anonymously so they can send messages successfully
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email && currentUser.email !== ADMIN_EMAIL) {
          showToast("Logged in, but you don't have admin editing rights.");
          setEditMode(false);
        }
      } else {
        // Automatically sign in as a guest to allow messaging (if enabled)
        try {
          await signInAnonymously(auth);
        } catch (error) {
          if (error.code === 'auth/admin-restricted-operation') {
            console.warn("Note: Anonymous Auth is disabled in Firebase console. Messages will be sent unauthenticated.");
          } else {
            console.error("Anonymous sign-in failed:", error);
          }
        }
      }
    });

    const safetyTimer = setTimeout(() => {
      setLoading((prev) => (prev ? false : prev));
    }, 4000);

    const docRef = doc(db, 'portfolios', APP_ID);
    const unsubscribeData = onSnapshot(docRef, (docSnap) => {
      clearTimeout(safetyTimer);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) setProfile(data.profile);
        if (data.projects) setProjects(data.projects);
        if (data.certificates) setCertificates(data.certificates);
        if (data.skillGroups) setSkillGroups(data.skillGroups);
        if (data.activityLogs) setActivityLogs(data.activityLogs);
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  const saveAllData = async (turnOffEditMode = false) => {
    if (!isAdminUser) {
      showToast("Only the admin can save changes.");
      return;
    }
    
    if (!isFirebaseConfigured) {
      showToast("Mock Save: Data will not persist. Add Firebase credentials!");
      if (turnOffEditMode) setEditMode(false);
      return;
    }

    const payload = { profile, projects, certificates, skillGroups, activityLogs };
    const sizeKB = getApproxSizeKB(payload);
    if (sizeKB > 900) {
      showToast(`Data too large (${sizeKB}KB / 1024KB limit). Remove images.`);
      return;
    }

    try {
      showToast("Saving changes...");
      const docRef = doc(db, 'portfolios', APP_ID);
      await setDoc(docRef, { ...payload, lastUpdated: new Date().toISOString() }, { merge: true });
      showToast("Changes saved successfully!");
      if (turnOffEditMode) setEditMode(false);
    } catch (error) {
      showToast("Error saving data. " + error.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgForm.name || !msgForm.email || !msgForm.message) {
      showToast("Please fill in all fields before sending.");
      return;
    }
    
    setSendingMsg(true);
    try {
      // Sending email directly using FormSubmit's AJAX API
      // This will send the email to the address saved in profile.email
      const response = await fetch(`https://formsubmit.co/ajax/${profile.email}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: msgForm.name,
          email: msgForm.email,
          message: msgForm.message,
          _subject: `New Portfolio Message from ${msgForm.name}`
        })
      });

      if (response.ok) {
        showToast("Message sent to your email successfully!");
        setMsgForm({ name: "", email: "", message: "" });
      } else {
        showToast("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error. Could not send email.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      showToast("Demo Mode: Logging in as Admin (Fake)");
      setUser({ email: ADMIN_EMAIL, uid: "mock-demo-id" });
      return;
    }
    if (!auth) return showToast("Firebase not initialized.");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      showToast("Login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      setUser(null); setEditMode(false);
      showToast("Logged out from Demo Mode.");
      return;
    }
    if (!auth) return;
    try {
      await signOut(auth); setEditMode(false);
      showToast("Logged out securely.");
    } catch (error) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 5000);
  };

  const goTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCertImageChange = async (i, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const compressedImage = await compressImage(file);
    updateCert(i, { image: compressedImage });
  };

  const handleProjectImageChange = async (i, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const compressedImage = await compressImage(file, 700, 0.6);
    updateProject(i, { image: compressedImage });
  };

  const handleCardMouseMove = (e) => {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    target.style.setProperty("--rotate-x", `${rotateX}deg`);
    target.style.setProperty("--rotate-y", `${rotateY}deg`);
  };

  const handleCardMouseLeave = (e) => {
    const { currentTarget: target } = e;
    target.style.setProperty("--rotate-x", `0deg`);
    target.style.setProperty("--rotate-y", `0deg`);
  };

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const Editable = ({ value, onChange, tag: Tag = "span", className = "", style = {}, placeholder = "" }) => (
    <Tag
      contentEditable={editMode}
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.textContent.trim() || placeholder)}
      className={className}
      style={{
        ...style,
        outline: "none",
        borderRadius: 4,
        ...(editMode ? { background: "rgba(212,175,106,0.12)", boxShadow: "0 0 0 1px rgba(212,175,106,0.5)", cursor: "text", padding: "1px 4px", margin: "-1px -4px", transition: "all 0.2s" } : {}),
      }}
    >
      {value}
    </Tag>
  );

  const TagEditor = ({ items, onChange }) => {
    const [draft, setDraft] = useState("");
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((tag, i) => (
          <span key={i} className="tag-pill group relative font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 overflow-hidden">
            <span className="relative z-10">{tag}</span>
            {editMode && (
              <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="relative z-10 opacity-70 hover:opacity-100 hover:text-red-400 ml-1 transition-colors">
                <X size={12} />
              </button>
            )}
            <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
          </span>
        ))}
        {editMode && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onChange([...items, draft.trim()]);
                setDraft("");
              }
            }}
            placeholder="+ add, Enter"
            className="font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full bg-transparent transition-colors focus:border-[var(--gold-bright)]"
            style={{ border: "1px dashed var(--border)", color: "var(--text-dim)", width: 110, outline: "none" }}
          />
        )}
      </div>
    );
  };

  const updateProject = (i, patch) => setProjects((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const updateCert = (i, patch) => setCertificates((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const updateLog = (i, patch) => setActivityLogs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070A] text-[#E8C888] font-mono text-sm tracking-widest relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF6A]/20 via-[#05070A] to-[#05070A] animate-pulse-slow"></div>
        <div className="z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-t-2 border-l-2 border-[#E8C888] rounded-full animate-spin"></div>
          <span className="uppercase tracking-[0.2em] animate-pulse">Loading Portfolio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="font-body selection:bg-[#D4AF6A]/30 selection:text-white" style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root{
          --bg: #05070A; 
          --panel: rgba(255,255,255,0.02); 
          --panel-strong: rgba(255,255,255,0.04);
          --border: rgba(255,255,255,0.08); 
          --border-soft: rgba(255,255,255,0.04);
          --gold: #D4AF6A; 
          --gold-bright: #E8C888;
          --text: #F3F4F6; 
          --text-dim: #9CA3AF; 
          --text-faint: #6B7280;
        }
        
        .font-display{ font-family: 'Fraunces', serif; }
        .font-body{ font-family: 'Inter', sans-serif; }
        .font-mono{ font-family: 'JetBrains Mono', monospace; }

        section[id]{ scroll-margin-top: 120px; }
        html{ scroll-behavior: smooth; cursor: none; }

        .glow-field { 
          background: 
            radial-gradient(800px circle at 85% 10%, rgba(212,175,106,0.09), transparent 60%), 
            radial-gradient(1000px circle at 10% 90%, rgba(212,175,106,0.06), transparent 50%),
            radial-gradient(600px circle at 50% 50%, rgba(212,175,106,0.04), transparent 60%);
          filter: blur(40px);
          animation: ambient-shift 25s ease-in-out infinite alternate;
        }
        .grain { 
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E"); 
          opacity: 0.15; mix-blend-mode: overlay; pointer-events: none;
        }

        @keyframes ambient-shift {
          0% { transform: scale(1) translate(0,0); }
          50% { transform: scale(1.08) translate(-2%, 2%); }
          100% { transform: scale(1) translate(2%, -2%); }
        }

        @keyframes intro-text {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); filter: blur(5px); }
          20% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          80% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-20px) scale(1.1); filter: blur(5px); }
        }
        .animate-intro-text {
          animation: intro-text 0.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }

        .final-intro-text {
          background: linear-gradient(135deg, var(--gold-bright), #fff, var(--gold));
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: intro-final-pop 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, gradient-flow 3s ease infinite;
        }

        @keyframes intro-final-pop {
          0% { opacity: 0; transform: scale(0.8) translateY(30px); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--gold-bright), var(--gold));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-flow 4s ease infinite;
          background-size: 200% 200%;
        }

        .spotlight-card {
          position: relative;
          background: var(--panel);
          border: 1px solid var(--border-soft);
          border-radius: 1.5rem;
          overflow: hidden;
          transform: perspective(1500px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) translateY(var(--translate-y, 0px)) scale(var(--scale-card, 1));
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease, border-color 0.4s ease;
          transform-style: preserve-3d;
          will-change: transform;
        }
        
        .spotlight-card::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          background: radial-gradient(
            1000px circle at var(--mouse-x, 0) var(--mouse-y, 0),
            rgba(255,255,255,0.09),
            transparent 30%
          );
          z-index: 0;
          pointer-events: none;
        }
        
        .spotlight-card:hover { 
          --translate-y: -8px;
          --scale-card: 1.02;
          background: var(--panel-strong); 
          border-color: rgba(212,175,106,0.4);
          box-shadow: 0 35px 70px -20px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,106,0.12);
        }
        .spotlight-card:hover::before { opacity: 1; }
        
        .spotlight-content { position: relative; z-index: 1; transform: translateZ(40px); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .spotlight-card:hover .spotlight-content { transform: translateZ(60px); }
        
        .spotlight-border {
          position: absolute; inset: 0; border-radius: 1.5rem; pointer-events: none;
          padding: 1px;
          background: radial-gradient(
            500px circle at var(--mouse-x, 0) var(--mouse-y, 0),
            rgba(212,175,106,0.95),
            transparent 30%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .spotlight-card:hover .spotlight-border { opacity: 1; }

        .btn-gold{ 
          background: linear-gradient(135deg, var(--gold-bright), var(--gold)); 
          color: #05070A; 
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
          cursor: none; border: none; 
          position: relative; overflow: hidden;
        }
        .btn-gold::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0));
          transform: translateY(-100%); transition: transform 0.6s;
        }
        .btn-gold:hover::after { transform: translateY(100%); }
        .btn-gold:hover{ transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px rgba(212,175,106,0.4); filter: brightness(1.1); }
        
        .btn-outline{ 
          border: 1px solid var(--border); color: var(--text); 
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
          cursor: none; background: none; 
        }
        .btn-outline:hover{ 
          border-color: rgba(212,175,106,0.6); 
          background: rgba(212,175,106,0.08); 
          transform: translateY(-4px) scale(1.02); 
          color: var(--gold-bright);
        }

        .tag-pill{ border: 1px solid var(--border-soft); color: var(--text-dim); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .tag-pill:hover{ border-color: rgba(212,175,106,0.5); color: var(--gold-bright); transform: translateY(-2px); }

        .reveal-up { opacity: 0; transform: translateY(80px) scale(0.95); filter: blur(5px); transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-up.is-visible { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        
        .reveal-scale { opacity: 0; transform: scale(0.85) translateY(50px); filter: blur(8px); transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-scale.is-visible { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        
        .reveal-rotate { opacity: 0; transform: perspective(1000px) rotateX(20deg) translateY(60px); filter: blur(5px); transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-rotate.is-visible { opacity: 1; transform: perspective(1000px) rotateX(0deg) translateY(0); filter: blur(0); }

        .reveal-left { opacity: 0; transform: translateX(-60px); filter: blur(5px); transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-left.is-visible { opacity: 1; transform: translateX(0); filter: blur(0); }
        
        .reveal-right { opacity: 0; transform: translateX(60px); filter: blur(5px); transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-right.is-visible { opacity: 1; transform: translateX(0); filter: blur(0); }

        .hover-float { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); animation: floating 6s ease-in-out infinite; }
        .hover-float:hover { animation-play-state: paused; transform: translateY(-10px) scale(1.05); }
        .hover-float:nth-child(2) { animation-delay: -2s; }
        .hover-float:nth-child(3) { animation-delay: -4s; }

        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .nav-link{ position:relative; color:var(--text-dim); transition:color .3s ease; cursor:none; background:none; border:none; }
        .nav-link:hover{ color:var(--text); }
        .nav-link::after{ 
          content:""; position:absolute; left:0; bottom:-6px; height:1px; width:0%; 
          background:var(--gold-bright); transition:width .4s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .nav-link:hover::after{ width:100%; }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(212,175,106,0.4); }

        .proj-num{ -webkit-text-stroke: 1px var(--border); color: transparent; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .spotlight-card:hover .proj-num { -webkit-text-stroke: 1px var(--gold-bright); color: rgba(212,175,106,0.1); transform: scale(1.1) translateX(10px); }
      `}</style>

      <CustomCursor />

      {}
      <div className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)] z-[100] transition-all duration-150 shadow-[0_0_15px_rgba(212,175,106,0.8)]" style={{ width: `${scrollProgress}%` }} />

      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full font-mono text-xs tracking-wider border border-[var(--gold)] transition-all duration-500 flex items-center gap-2 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`} 
           style={{ background: "rgba(10,14,20,0.9)", color: "var(--gold-bright)", backdropFilter: "blur(10px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        <Sparkles size={14} /> {toastMessage}
      </div>

      <div className="fixed inset-0 pointer-events-none glow-field z-0" />
      <div className="fixed inset-0 pointer-events-none grain z-0" />

      {showIntro && (
        <IntroScreen onComplete={handleIntroComplete} />
      )}

      <div className="relative z-10">
        <header
          className="nav-shell fixed top-0 w-full z-50 transition-all duration-500"
          style={{
            background: scrolled ? "rgba(5,7,10,0.85)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid var(--border-soft)" : "1px solid transparent",
            paddingTop: scrolled ? "0" : "1rem"
          }}
        >
          <nav className="max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
            <button onClick={goTo("top")} className="group flex items-center gap-3.5 cursor-none bg-transparent border-none">
              <span className="w-10 h-10 rounded-full flex items-center justify-center font-display text-base overflow-hidden border border-[var(--border)] text-[var(--gold-bright)] group-hover:border-[var(--gold-bright)] transition-colors relative bg-[var(--panel)]">
                {initials}
              </span>
              <div className="flex flex-col items-start">
                <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors">{profile.name}</span>
                <span className="font-mono text-[9px] tracking-widest text-[var(--text-dim)] uppercase mt-0.5">Portfolio</span>
              </div>
            </button>
            
            <div className="hidden md:flex gap-12">
              {NAV.map((n) => (
                <button key={n.id} onClick={goTo(n.id)} className="nav-link font-mono text-xs tracking-widest uppercase py-2">{n.label}</button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              {isAdminUser && (
                <button
                  onClick={() => { if (editMode) saveAllData(true); else setEditMode(true); }}
                  className="btn-outline hidden sm:inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase px-5 py-3 rounded-full"
                  style={editMode ? { background: "rgba(212,175,106,0.15)", borderColor: "var(--gold-bright)", color: "var(--gold-bright)" } : {}}
                >
                  {editMode ? <Check size={14} /> : <Pencil size={14} />}
                  {editMode ? "Save & Exit" : "Edit Site"}
                </button>
              )}
              <button onClick={goTo("contact")} className="btn-outline hidden sm:inline-flex font-mono text-[11px] tracking-widest uppercase px-6 py-3 rounded-full hover:bg-white/5">
                Let's talk
              </button>
            </div>
          </nav>
        </header>

        {}
        {editMode && isAdminUser && (
          <div className="max-w-7xl mx-auto px-6 md:px-12 pt-32">
            <div className="font-mono text-[11px] tracking-wide px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md" style={{ background: "rgba(212,175,106,0.1)", border: "1px solid rgba(212,175,106,0.3)", color: "var(--gold-bright)" }}>
              <div className="w-2 h-2 rounded-full bg-[var(--gold-bright)] animate-pulse"></div>
              Live Edit Mode active. Changes are public upon saving.
            </div>
          </div>
        )}

        <main id="top" className="max-w-7xl mx-auto px-6 md:px-12">
          <section className="min-h-[90vh] pt-32 pb-24 flex flex-col justify-center items-center text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[var(--gold-bright)]/10 to-transparent blur-3xl rounded-full pointer-events-none"></div>

            <div className="max-w-4xl relative z-10 flex flex-col items-center">
              <div className="reveal-up">
                <p className="font-mono text-[11px] tracking-[0.3em] uppercase mb-8 flex items-center justify-center gap-3 text-[var(--gold-bright)]">
                  <span className="w-12 h-[1px] bg-[var(--gold-bright)] opacity-50"></span>
                  <Editable value={profile.role} onChange={(v) => setProfile((p) => ({ ...p, role: v }))} /> 
                  <span className="opacity-50">/</span> 
                  <Editable value={profile.focus} onChange={(v) => setProfile((p) => ({ ...p, focus: v }))} />
                  <span className="w-12 h-[1px] bg-[var(--gold-bright)] opacity-50"></span>
                </p>
              </div>

              <h1 className="font-display leading-[1.05] reveal-up delay-100" style={{ fontSize: "clamp(52px, 8vw, 110px)", fontWeight: 400, letterSpacing: "-0.02em" }}>
                <Editable value={profile.headline} onChange={(v) => setProfile((p) => ({ ...p, headline: v }))} className="block" />
                <span className="inline-block relative mt-2">
                  <Editable value={profile.headlineAccent} onChange={(v) => setProfile((p) => ({ ...p, headlineAccent: v }))} className="text-gradient italic" />
                  <svg className="absolute w-full h-[0.4em] -bottom-3 left-0 text-[var(--gold-bright)] opacity-40 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </h1>

              <p className="mt-12 max-w-2xl text-[18px] md:text-[20px] leading-[1.8] font-light reveal-up delay-200" style={{ color: "var(--text-dim)" }}>
                <Editable tag="span" value={profile.intro} onChange={(v) => setProfile((p) => ({ ...p, intro: v }))} />
              </p>

              <div className="flex gap-6 mt-14 flex-wrap justify-center reveal-up delay-300">
                <button onClick={goTo("work")} className="btn-gold font-mono text-[11px] tracking-widest uppercase px-10 py-5 rounded-full font-semibold flex items-center gap-3">
                  View the work <ArrowUpRight size={15} />
                </button>
                <button onClick={goTo("contact")} className="btn-outline font-mono text-[11px] tracking-widest uppercase px-10 py-5 rounded-full flex items-center gap-3 bg-white/5">
                  Let's Collaborate
                </button>
              </div>

              <div className="flex gap-16 lg:gap-24 mt-24 flex-wrap justify-center reveal-up delay-400">
                {profile.stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-16 lg:gap-24 group relative hover-float">
                    <div className="relative z-10 cursor-none">
                      <div className="font-display text-[48px] md:text-[56px] leading-none mb-4 transition-colors duration-300 group-hover:text-[var(--text)]" style={{ color: "var(--gold-bright)" }}>
                        <Editable value={s.v} onChange={(v) => setProfile((p) => ({ ...p, stats: p.stats.map((st, idx) => (idx === i ? { ...st, v } : st)) }))} />
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
                        <Editable value={s.k} onChange={(v) => setProfile((p) => ({ ...p, stats: p.stats.map((st, idx) => (idx === i ? { ...st, k: v } : st)) }))} />
                      </div>
                    </div>
                    {i < profile.stats.length - 1 && <div className="hidden sm:block w-[1px] h-16 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {}
          <section id="work" className="py-32 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[1px] bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent"></div>
            
            <SectionHead eyebrow="Selected Work" title="Featured Projects" count={`${projects.length} artifacts`} />
            
            <div className="grid grid-cols-1 gap-12 md:gap-20 mt-20">
              {[...projects].reverse().map((p, originalIndex) => {
                const i = projects.length - 1 - originalIndex; 
                return (
                  <div 
                    key={i} 
                    className="spotlight-card group reveal-rotate"
                    style={{ transitionDelay: `${originalIndex * 150}ms` }}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className="spotlight-border"></div>
                    <div className="spotlight-content p-8 md:p-12">
                      
                      {editMode && (
                        <div className="absolute top-6 right-6 flex gap-2 z-20">
                          <span className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 cursor-none hover:bg-red-500/20 hover:scale-110 transition-all" onClick={() => setProjects((prev) => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 size={16} />
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
                        <div className="order-2 lg:order-1 flex flex-col h-full justify-center">
                          <div className="font-display proj-num text-[80px] leading-none mb-6 opacity-30 select-none">
                            {String(originalIndex + 1).padStart(2, "0")}
                          </div>
                          
                          <h3 className="font-display text-3xl md:text-4xl font-light mb-4 text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors">
                            <Editable value={p.title} onChange={(v) => updateProject(i, { title: v })} />
                          </h3>
                          
                          <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-faint)] mb-8 flex items-center gap-4">
                            <span className="w-6 h-[1px] bg-[var(--border)]"></span>
                            <Editable value={p.subtitle} onChange={(v) => updateProject(i, { subtitle: v })} />
                          </div>
                          
                          <p className="text-[15px] leading-[1.8] text-[var(--text-dim)] font-light mb-10">
                            <Editable tag="span" value={p.desc} onChange={(v) => updateProject(i, { desc: v })} placeholder="Describe the project challenge, solution, and impact..." />
                          </p>
                          
                          <div className="mb-10">
                            <TagEditor items={p.stack} onChange={(items) => updateProject(i, { stack: items })} />
                          </div>

                          <div className="flex flex-wrap gap-4 mt-auto">
                            {editMode ? (
                              <div className="flex flex-col gap-3 w-full">
                                <InputRow icon={<ExternalLink size={14}/>} value={p.live} onChange={(v) => updateProject(i, { live: v })} placeholder="Live URL" color="var(--gold-bright)" />
                                <InputRow icon={<Github size={14}/>} value={p.source} onChange={(v) => updateProject(i, { source: v })} placeholder="Source URL" color="var(--text-dim)" />
                              </div>
                            ) : (
                              <>
                                {p.live !== "#" && (
                                  <a href={p.live} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 text-[var(--gold-bright)] hover:opacity-70 transition-opacity cursor-none">
                                    <ExternalLink size={14} /> Live Site
                                  </a>
                                )}
                                {p.source !== "#" && (
                                  <a href={p.source} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-none">
                                    <Github size={14} /> Source
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* FULL PREVIEW CONTAINER */}
                        <div className="order-1 lg:order-2 relative aspect-[16/10] lg:aspect-auto lg:h-[420px] w-full rounded-2xl overflow-hidden border border-[var(--border-soft)] bg-[#030508] group/img shrink-0 shadow-2xl flex items-center justify-center p-3">
                          {p.image ? (
                            <img src={p.image} alt={p.title} className="w-full h-full object-contain opacity-90 group-hover/img:opacity-100 group-hover/img:scale-102 transition-all duration-700 ease-out" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--border)]">
                              <Code2 size={64} strokeWidth={1} />
                              <span className="font-mono text-xs uppercase tracking-widest mt-4 opacity-50">Project Visual</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent opacity-40 pointer-events-none"></div>

                          {editMode && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity p-6 z-20">
                              <label className="btn-outline px-6 py-3 rounded-full flex items-center gap-3 cursor-none">
                                <ImageIcon size={16} /> 
                                <span className="font-mono text-xs tracking-widest uppercase">Upload Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProjectImageChange(i, e)} />
                              </label>
                              {p.image && (
                                <button onClick={() => updateProject(i, { image: null })} className="mt-4 font-mono text-[10px] uppercase text-red-400 tracking-widest hover:text-red-300">
                                  Remove Image
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {editMode && (
                <div className="spotlight-card border-dashed border-2 hover:bg-white/[0.02] cursor-none min-h-[300px] flex flex-col items-center justify-center text-[var(--text-dim)] hover:text-[var(--gold-bright)] hover:border-[var(--gold-bright)] transition-all" onClick={() => setProjects((prev) => [...prev, emptyProject()])} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                  <div className="spotlight-border"></div>
                  <div className="spotlight-content flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-current flex items-center justify-center">
                      <Plus size={24} />
                    </div>
                    <span className="font-mono text-sm uppercase tracking-[0.2em]">Add New Project</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {}
          <section id="certificates" className="py-32 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[1px] bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent"></div>
            
            <SectionHead eyebrow="Credentials" title="Certifications" count={`${certificates.length} verified`} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              {[...certificates].reverse().map((c, originalIndex) => {
                const i = certificates.length - 1 - originalIndex;
                return (
                  <div key={i} className="spotlight-card group reveal-scale flex flex-col h-full min-h-[300px]" style={{ transitionDelay: `${originalIndex * 100}ms` }} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                    <div className="spotlight-border"></div>
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--gold-bright)] to-transparent opacity-50"></div>
                    
                    <div className="spotlight-content p-8 flex flex-col h-full">
                      {editMode && (
                        <div className="absolute top-4 right-4 z-20">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 cursor-none hover:bg-red-500/20 transition-all" onClick={() => setCertificates((prev) => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 size={14} />
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-8">
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border border-[var(--gold-bright)]/30 text-[var(--gold-bright)] bg-[var(--gold-bright)]/5">
                          <Editable value={c.seal} onChange={(v) => updateCert(i, { seal: v })} />
                        </span>
                        <BadgeCheck size={24} className="text-[var(--border)] group-hover:text-[var(--gold-bright)] transition-colors duration-500" strokeWidth={1.2} />
                      </div>
                      
                      <h4 className="font-display text-xl leading-snug font-light mb-3 group-hover:text-[var(--gold-bright)] transition-colors">
                        <Editable value={c.title} onChange={(v) => updateCert(i, { title: v })} />
                      </h4>
                      
                      <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-dim)] mb-5 flex items-center gap-2">
                        <Editable value={c.issuer} onChange={(v) => updateCert(i, { issuer: v })} />
                      </div>
                      
                      <p className="text-[13px] leading-[1.7] text-[var(--text-faint)] font-light mb-6 flex-grow">
                        <Editable tag="span" value={c.desc} onChange={(v) => updateCert(i, { desc: v })} placeholder="Add certificate description..." />
                      </p>

                      {c.image && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-[var(--border-soft)] group/img relative h-40 bg-[#030508] w-full shrink-0 flex items-center justify-center p-1">
                          <img src={c.image} alt={c.title} className="w-full h-full object-contain opacity-90 group-hover/img:opacity-100 transition-opacity" />
                        </div>
                      )}

                      {editMode && (
                        <div className="space-y-3 mb-6">
                          <label className="border border-dashed border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-none hover:border-[var(--gold-bright)] hover:bg-[var(--gold-bright)]/5 transition-colors">
                            <ImageIcon size={18} color="var(--text-dim)" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-dim)]">Attach Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCertImageChange(i, e)} />
                          </label>
                          <InputRow icon={<ShieldCheck size={14}/>} value={c.verifyUrl} onChange={(v) => updateCert(i, { verifyUrl: v })} placeholder="Verification URL" color="var(--gold-bright)" />
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-auto pt-6 border-t border-[var(--border-soft)]">
                        <span className="font-mono text-[11px] tracking-widest text-[var(--text-faint)]">
                          <Editable value={c.date} onChange={(v) => updateCert(i, { date: v })} />
                        </span>
                        
                        {!editMode && c.verifyUrl && c.verifyUrl !== "#" ? (
                          <a href={c.verifyUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-[var(--gold-bright)] hover:underline flex items-center gap-1.5 cursor-none">
                            <ShieldCheck size={13} /> Verify <ArrowUpRight size={11} />
                          </a>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-dim)]">Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {editMode && (
                <div className="spotlight-card border-dashed border-2 hover:bg-white/[0.02] cursor-none min-h-[300px] flex flex-col items-center justify-center text-[var(--text-dim)] hover:text-[var(--gold-bright)] hover:border-[var(--gold-bright)] transition-all" onClick={() => setCertificates((prev) => [...prev, emptyCert()])} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                  <div className="spotlight-border"></div>
                  <div className="spotlight-content flex flex-col items-center gap-4">
                    <Plus size={24} />
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Add Credential</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {}
          <section id="activity" className="py-32 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[1px] bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent"></div>
            
            <SectionHead eyebrow="Timeline" title="Activity & Milestones" count={`${activityLogs.length} updates`} />
            
            <div className="mt-20 relative before:absolute before:inset-0 before:ml-4 md:before:ml-6 before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-[var(--gold-bright)] before:via-[var(--border)] before:to-transparent">
              <div className="space-y-12">
                {[...activityLogs].reverse().map((log, originalIndex) => {
                  const i = activityLogs.length - 1 - originalIndex;
                  return (
                    <div key={i} className="relative pl-12 md:pl-20 reveal-right group" style={{ transitionDelay: `${originalIndex * 100}ms` }}>
                      <div className="absolute left-[7px] md:left-[15px] top-1.5 w-4 h-4 rounded-full bg-[var(--bg)] border-2 border-[var(--gold-bright)] shadow-[0_0_10px_rgba(212,175,106,0.5)] group-hover:bg-[var(--gold-bright)] group-hover:scale-125 transition-all duration-300"></div>
                      
                      {editMode && (
                        <div className="absolute top-0 right-0 z-20">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 cursor-none hover:bg-red-500/20 transition-all" onClick={() => setActivityLogs((prev) => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 size={14} />
                          </span>
                        </div>
                      )}

                      <div className="spotlight-card p-6 md:p-8" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                        <div className="spotlight-border"></div>
                        <div className="spotlight-content">
                          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-[var(--gold-bright)] mb-3">
                            <Calendar size={14} />
                            <Editable value={log.date} onChange={(v) => updateLog(i, { date: v })} placeholder="e.g. Aug 2026" />
                          </div>
                          <h4 className="font-display text-xl md:text-2xl mb-3 text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors">
                            <Editable value={log.title} onChange={(v) => updateLog(i, { title: v })} placeholder="Milestone Title" />
                          </h4>
                          <p className="text-[14px] leading-[1.8] text-[var(--text-dim)] font-light">
                            <Editable tag="span" value={log.desc} onChange={(v) => updateLog(i, { desc: v })} placeholder="Describe this milestone or activity..." />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {editMode && (
                <div className="relative pl-12 md:pl-20 mt-12">
                  <div className="absolute left-[7px] md:left-[15px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg)] border-2 border-[var(--border-soft)]"></div>
                  <div className="spotlight-card border-dashed border-2 hover:bg-white/[0.02] cursor-none py-6 flex flex-col items-center justify-center text-[var(--text-dim)] hover:text-[var(--gold-bright)] hover:border-[var(--gold-bright)] transition-all" onClick={() => setActivityLogs((prev) => [...prev, emptyLog()])} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                    <div className="spotlight-border"></div>
                    <div className="spotlight-content flex items-center gap-3">
                      <Plus size={18} />
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Add Log Entry</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section id="skills" className="py-32 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[1px] bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent"></div>
            
            <SectionHead eyebrow="Toolkit" title="Capabilities & Stack" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mt-16 reveal-up">
              {skillGroups.map((group, gi) => (
                <div key={gi} className="relative pl-6 border-l border-[var(--border-soft)] hover:border-[var(--gold-bright)] transition-colors duration-500 reveal-scale" style={{ transitionDelay: `${gi * 150}ms` }}>
                  <div className="absolute top-0 -left-[5px] w-[9px] h-[9px] rounded-full bg-[var(--bg)] border-2 border-[var(--border-soft)]"></div>
                  <div className="absolute top-0 -left-[5px] w-[9px] h-[9px] rounded-full bg-[var(--gold-bright)] shadow-[0_0_10px_var(--gold-bright)] opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-3 text-[var(--gold-bright)]">
                    <Sparkles size={14} className="opacity-70" />
                    <Editable value={group.label} onChange={(v) => setSkillGroups((prev) => prev.map((g, idx) => (idx === gi ? { ...g, label: v } : g)))} />
                  </h4>
                  <div className="pt-2">
                    <TagEditor items={group.items} onChange={(items) => setSkillGroups((prev) => prev.map((g, idx) => (idx === gi ? { ...g, items } : g)))} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {}
          <section id="contact" className="py-32 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[1px] bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="spotlight-card rounded-[2.5rem] p-8 md:p-12 reveal-left" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                <div className="spotlight-border"></div>
                <div className="spotlight-content">
                  <div className="w-14 h-14 border border-[var(--border-soft)] rounded-full flex items-center justify-center mb-6 bg-[var(--panel)]">
                    <Mail size={22} className="text-[var(--gold-bright)]" />
                  </div>
                  
                  <p className="font-mono text-[11px] tracking-[0.3em] uppercase mb-4 text-[var(--gold-bright)]">Initiate Contact</p>
                  
                  <h2 className="font-display text-3xl md:text-4xl leading-tight mb-6 font-light">
                    Let's build something <span className="text-gradient italic">extraordinary.</span>
                  </h2>
                  
                  <p className="text-[15px] leading-relaxed text-[var(--text-dim)] font-light mb-8">
                    Whether you have an exciting project in mind, a technical challenge to discuss, or just want to connect — my inbox is always open.
                  </p>

                  <div className="space-y-4 mb-8">
                    <a href={`mailto:${profile.email}`} className="font-mono text-xs text-[var(--gold-bright)] hover:underline flex items-center gap-3 cursor-none">
                      <Mail size={15} /> <Editable value={profile.email} onChange={(v) => setProfile((p) => ({ ...p, email: v }))} />
                    </a>
                  </div>

                  <div className="flex gap-6 items-center pt-6 border-t border-[var(--border-soft)]">
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-dim)] hover:text-[var(--gold-bright)] transition-colors cursor-none hover:scale-110 transform duration-300">
                      <LinkedinIcon size={22} />
                    </a>
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-[var(--text-dim)] hover:text-[var(--gold-bright)] transition-colors cursor-none hover:scale-110 transform duration-300">
                      <Github size={22} />
                    </a>
                  </div>

                  {editMode && (
                    <div className="mt-8 space-y-3 pt-6 border-t border-[var(--border)]">
                      <InputRow icon={<LinkedinIcon size={14}/>} value={profile.linkedin} onChange={(v) => setProfile((p) => ({ ...p, linkedin: v }))} placeholder="LinkedIn URL" color="var(--text-dim)" />
                      <InputRow icon={<Github size={14}/>} value={profile.github} onChange={(v) => setProfile((p) => ({ ...p, github: v }))} placeholder="GitHub URL" color="var(--text-dim)" />
                    </div>
                  )}
                </div>
              </div>

              <div className="spotlight-card rounded-[2.5rem] p-8 md:p-12 reveal-right" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                <div className="spotlight-border"></div>
                <div className="spotlight-content">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare size={20} className="text-[var(--gold-bright)]" />
                    <h3 className="font-display text-2xl font-light">Send a Direct Message</h3>
                  </div>

                  <form onSubmit={handleSendMessage} className="space-y-5">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-2">Your Name</label>
                      <input
                        type="text"
                        required
                        value={msgForm.name}
                        onChange={(e) => setMsgForm({ ...msgForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--gold-bright)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-2">Your Email</label>
                      <input
                        type="email"
                        required
                        value={msgForm.email}
                        onChange={(e) => setMsgForm({ ...msgForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--gold-bright)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-2">Message</label>
                      <textarea
                        required
                        rows={4}
                        value={msgForm.message}
                        onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                        placeholder="Hello Dhiraj, I'd love to discuss an opportunity..."
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--gold-bright)] transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingMsg}
                      className="btn-gold w-full font-mono text-xs uppercase tracking-widest py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      {sendingMsg ? "Sending..." : <>Send Message <Send size={14} /></>}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-24 font-mono text-[10px] uppercase tracking-widest text-[var(--text-faint)] reveal-up delay-200">
              <span className="flex items-center gap-2">
                © {new Date().getFullYear()} {profile.name} <span className="w-1 h-1 rounded-full bg-[var(--gold-bright)] animate-pulse"></span> Crafted with Precision
              </span>
              
              <div className="flex gap-8 items-center">
                {user ? (
                  <button onClick={handleLogout} className="flex items-center gap-2 hover:text-[var(--text)] transition-colors cursor-none">
                    <LogOut size={14} /> Sign Out
                  </button>
                ) : (
                  <button onClick={handleGoogleLogin} className="flex items-center gap-2 hover:text-[var(--gold-bright)] transition-colors cursor-none group">
                    <LogIn size={14} className="group-hover:scale-110 transition-transform" /> Admin
                  </button>
                )}
                
                <button onClick={goTo("top")} className="flex items-center gap-2 hover:text-[var(--gold-bright)] transition-colors cursor-none group">
                  Top <ArrowUp size={14} className="group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, count }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 reveal-left">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-4 flex items-center gap-4 text-[var(--gold-bright)]">
          <span className="w-12 h-[1px] bg-gradient-to-r from-[var(--gold-bright)] to-transparent opacity-70"></span>
          {eyebrow}
        </p>
        <h2 className="font-display font-light" style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>{title}</h2>
      </div>
      {count && (
        <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-dim)] border border-[var(--border-soft)] px-4 py-2 rounded-full bg-[var(--panel)] hover:border-[var(--gold-bright)] hover:text-[var(--gold-bright)] transition-all duration-300">
          {count}
        </div>
      )}
    </div>
  );
}

function InputRow({ icon, value, onChange, placeholder, color }) {
  return (
    <div className="flex items-center gap-3 bg-[var(--bg)] border border-[var(--border-soft)] rounded-lg px-4 py-2.5 focus-within:border-[var(--gold-bright)] transition-colors">
      <div style={{ color }}>{icon}</div>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono text-[11px] bg-transparent w-full outline-none text-[var(--text)] placeholder-[var(--text-faint)] tracking-wider"
      />
    </div>
  );
}
