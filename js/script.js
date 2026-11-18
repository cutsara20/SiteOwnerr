const K="siteowner_v4",TGT=2.5,BJ=0.05;
let STD=150000,LEM=25000,BON=30000,PEN=20000,PAP=10000,PSD=1,PST=.5,PAS=1,PAM=.5,AL=.8,AB=.95,LM1=1,LM2=1,OPI=5,VMAX=5;
const DW=[["Pak Budi","Pembesian","kg besi",250],["Pak Joko","Cor beton","m³",6],["Pak Agus","Bekisting","m²",12],["Pak Rahmat","Pasang bata","m²",10],["Pak Dani","Finishing","m²",18]];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let W=DW;
const ST=["Absen","Bekerja","Sakit, dilarang kerja","APD tidak lengkap, dilarang kerja"];
const OP={s:["Sakit","Kurang sehat","Sehat"],a:["Tidak lengkap","Sebagian","Lengkap"],t:["Tidak teliti","Kurang teliti","Teliti"],d:["Tidak patuh","Setengah patuh","Patuh"]},SK=[1,3,5],LB=m=>m<=0?"Tidak lembur":(m>=60?Math.floor(m/60)+" jam":"")+(m%60&&m>=60?" ":"")+(m%60?m%60+" menit":"");
const $=s=>document.querySelector(s),Rp=n=>"Rp "+Math.round(n).toLocaleString("id-ID"),F=(n,d=1)=>Number(n).toFixed(d).replace(".",",");
let S={nama:"Proyek Gedung Contoh",dur:20,awal:65,days:[],meta:[],op:[],W:DW.map(w=>w.slice()),cfg:{},log:[],shape:"s",plan:[],planHist:[],anggaran:0,fin:[],raw:null,corr:[],apprLog:[],appr:{},seals:[],fcfg:{nilai:0,rab:[]},matm:[],mat:[],tasks:[],tprog:[],finLog:[]};
lc();

function lc() {
    W=S.W;
    const c=S.cfg,g=(k,d)=>c[k]===undefined?d:c[k];
    STD=g("std",150000);
    LEM=g("lem",25000);
    BON=g("bon",30000);
    PEN=g("pen",20000);
    PAP=g("pap",10000);
    PSD=g("psd",g("psk",1));
    PST=g("pst",.5);
    PAS=g("pas",1);
    PAM=g("pam",g("pad",.5));
    AL=g("al",.8);
    AB=g("ab",.95);
    LM1=g("lm1",1);
    LM2=g("lm2",1);
    OPI=Math.max(1,Math.round(g("opi",5)));
    VMAX=Math.max(1.5,g("vmax",5))
}

function calc(rows) {
    let fit=0,sk=0,ap=0,ps=0,ab=0,lem=0,up=0,ks=0,lt=0,snd=0,asd=0;
    const o=rows.map((r,i)=> {
        if(!r.h) {
            ab++;
            return{st:0,kpi:0,up:0,l:0,pk:0,lm:0,bn:0,pt:0}
        }
        if(r.s==0||r.a==0) {
            const sak=r.s==0,sdk=r.sd===0,tdis=r.ar===1,u=STD*(sak?(sdk?PST:PSD):(tdis?PAS:PAM)),ket=sak?(sdk?"Sakit, tanpa surat dokter":"Sakit, dengan surat dokter"):(tdis?"APD tidak disediakan/rusak":"Menolak memakai APD");
            up+=u;
            if(sak) {
                sk++;
                if(sdk)snd++;
                return{st:2,kpi:0,up:u,l:0,pk:u,lm:0,bn:0,pt:0,ket}
            }
            ap++;
            if(tdis)asd++;
            return{st:3,kpi:0,up:u,l:0,pk:u,lm:0,bn:0,pt:0,ket}
        }
        const ra=(r.v||0)/W[i][3],k=ra>=1.1?5:ra>=.95?4:ra>=.8?3:ra>=.6?2:1,kpi=(k+SK[r.t]+SK[r.d])/15*100,lr=(r.l||0)/60,l=ra>=AL&&r.s==2?lr:0;
        if(lr>l)lt++;
        if(r.a==1)ps++;
        const lm=LEM*(Math.min(l,1)*LM1+Math.max(l-1,0)*LM2),bn=kpi>=85&&ra>=AB&&r.a==2?BON:0,pt=(kpi<65?PEN:0)+(r.a==1?PAP:0),u=STD+lm+bn-pt;
        fit++;
        ks+=kpi;
        lem+=l;
        up+=u;
        return{st:1,kpi,up:u,l,ra,lr,t:r.t,d:r.d,ks:k,kt:SK[r.t],kd:SK[r.d],pk:STD,lm,bn,pt}
    });
    const rk=fit?ks/fit:0,f=!fit?0:rk>=85?1.1:rk>=65?1:.8;
    return{o,fit,sk,ap,ps,ab,lem,lt,snd,asd,up,rk,gain:TGT*fit/rows.length*f+lem*BJ}
}

function M() {
    const n=S.days.length,cs=[];
    let pr=S.awal,up=0,ap=0;
    S.days.forEach(d=> {
        const c=calc(d);
        pr=Math.min(100,pr+c.gain);
        c.prog=pr;
        cs.push(c);
        up+=c.up;
        ap+=c.ap-c.asd+c.ps
    });
    const prSys=pr,lop=(S.op||[]).slice(-1)[0];
    let gap=0;
    if(lop) {
        const sd=lop.d<=0?S.awal:(cs[lop.d-1]?cs[lop.d-1].prog:prSys);
        gap=Math.max(0,sd-lop.v)
    }
    pr=lop?Math.min(100,lop.v+cs.slice(lop.d).reduce((a,c)=>a+c.gain,0)):prSys;
    const ren=planAt(n),dev=pr-ren,rata=n?(pr-S.awal)/n:0,sisa=100-pr, est=rata>0&&sisa>0?Math.ceil(sisa/rata):null,sk=S.dur-n,bud=S.days.reduce((a,d)=>a+d.length*STD,0);
    let lv,tx;
    if(pr>=100) {
        lv="ok";
        tx="Proyek selesai 100%"
    } else if(!n) {
        lv="ok";
        tx="Belum ada data"
    } else if(dev>=.5) {
        lv="ok";
        tx="Lebih cepat dari jadwal"
    } else if(dev>=-1) {
        lv="ok";
        tx="Sesuai jadwal"
    } else if(dev>=-5) {
        lv="wa";
        tx="Potensi terlambat"
    } else {
        lv="bad";
        tx="Kritis – terancam terlambat parah"
    }
    return{n,cs,pr,prSys,gap,lop,ren,dev,rata,sisa,est,sk,up,ap,bud,lv,tx,last:cs[n-1]}
}

function alerts(m) {
    const a=[],{last:l}=m;
    if(!m.n)return[["wa","Isi Input Harian untuk mulai memantau proyek."]];
    if(m.est!==null&&m.est>m.sk) {
        const t=m.est-m.sk;
        let s="Proyeksi terlambat "+t+" hari kerja pada kecepatan saat ini.";
        if(m.sk>0) {
            const j=Math.ceil((m.sisa/m.sk-m.rata)/BJ);
            s+=" Untuk mengejar jadwal perlu sekitar "+j+" jam lembur tambahan per hari (total semua pekerja).";
        } else s+=" Masa kontrak habis, pertimbangkan addendum waktu.";
        a.push(["bad",s])
    } else if(m.est!==null)a.push(["ok","Proyeksi selesai "+m.est+" hari lagi, cadangan "+(m.sk-m.est)+" hari dari kontrak."]);
    if(l.ap>0)a.push(["bad","Hari ini "+l.ap+" pekerja APD tidak lengkap dan dilarang bekerja. Berikan APD pengganti."]);
    if(l.asd>0)a.push(["bad","Temuan: "+l.asd+" pekerja tidak dapat memakai APD karena tidak disediakan/rusak. Ini tanggung jawab proyek, bukan pekerja. Segera sediakan APD standar."]);
    if(l.ps>0)a.push(["wa",l.ps+" pekerja memakai APD sebagian. Boleh bekerja, tetapi dikenakan potongan dan teguran."]);
    if(l.sk>0)a.push(["wa",l.sk+" pekerja sakit/tidak fit hari ini. Arahkan ke poliklinik proyek."+(l.snd?" "+l.snd+" di antaranya tanpa surat dokter, upah mengikuti pengaturan ("+Math.round(PST*100)+"%).":"")]);
    if(l.ab>0)a.push(["wa",l.ab+" pekerja absen. Siapkan tenaga cadangan agar progres tidak turun."]);
    if(m.ap>=3)a.push(["bad","Total pelanggaran APD "+m.ap+" kasus. Disarankan safety talk atau toolbox meeting."]);
    if(m.up>m.bud)a.push(["wa","Biaya upah kumulatif melebihi anggaran normal sebesar "+Rp(m.up-m.bud)+"."]);
    else a.push(["ok","Biaya upah kumulatif masih di bawah anggaran normal (selisih "+Rp(m.bud-m.up)+")."]);
    return a
}

function flags(m) {
    const f=[],n=m.n;
    if(n&&m.last.lt>0)f.push(["wa",m.last.lt+" pengajuan lembur hari ini tidak dibayar (hasil di bawah "+Math.round(AL*100)+"% target atau pekerja kurang sehat)."]);
    if(m.gap>2)f.push(["bad","Progres sistem lebih tinggi "+F(m.gap)+"% dari hasil opname lapangan. Progres dikoreksi mengikuti opname."]);
    if(n<3)return f;
    const R=m.cs.slice(-5),avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
    W.forEach((w,i)=> {
        const L=R.map(c=>c.o[i]||{st:0}).filter(o=>o.st==1);
        if(L.length<3)return;
        const nm=w[0],vr=avg(L.map(o=>o.ra)),td=avg(L.map(o=>(o.t+o.d)/2)),lv=avg(L.map(o=>o.lr));
        if(L.every(o=>o.t==2&&o.d==2))f.push(["bad",nm+": selalu dinilai Teliti dan Patuh K3 tanpa variasi ("+L.length+" hari). Perlu diverifikasi QC."]);
        if(td>=1.8&&vr<.75)f.push(["bad",nm+": skor kualitas tinggi tetapi volume hasil hanya "+F(vr*100,0)+"% dari target. Tidak konsisten."]);
        if(L.filter(o=>o.lr>0&&o.ra<AL).length>=2)f.push(["wa",nm+": mengajukan lembur berulang kali padahal hasil di bawah "+Math.round(AL*100)+"% target."]);
        if(lv>=3.5)f.push(["wa",nm+": lembur hampir selalu penuh (rata-rata "+F(lv)+" jam per hari)."]);
        if(L.filter(o=>o.ra>1.5).length>=2)f.push(["wa",nm+": volume melebihi 150% target berulang. Cek ukuran dan volume di lapangan."])
    });
    const cp=c=>c.gain>0?c.up/c.gain:0,pre=m.cs.slice(0,-1).map(cp).filter(x=>x>0);
    if(pre.length&&cp(m.last)>1.5*avg(pre))f.push(["wa","Biaya upah per 1% progres hari ini melonjak lebih dari 1,5 kali rata-rata hari sebelumnya."]);
    return f
}

function rank(m) {
    return W.map((w,i)=> {
        let s=0,c=0,v=0;
        m.cs.forEach(d=> {
            const o=d.o[i]||{st:0};
            if(o.st==1) {
                s+=o.kpi;
                c++
            } else if(o.st>1)v++
        });
        return{n:w[0],z:w[1],k:c?s/c:0,c,v}
    }).sort((a,b)=>b.k-a.k)
}

function report(m,al) {
    if(!m.n)return"Belum ada data audit.";
    const l=m.last,e=m.est===null?"-":m.est+" hari kerja";
    return`*LAPORAN HARIAN – ${S.nama}*\nHari ke-${m.n} dari ${S.dur}\n\nProgres aktual : ${F(m.pr)}%\nProgres rencana: ${F(m.ren)}%\nDeviasi        : ${m.dev>=0?"+":""}${F(m.dev)}%\nStatus         : ${m.tx}\nEstimasi sisa  : ${e} (sisa kontrak ${Math.max(0,m.sk)})\n\n*Tenaga kerja*\nBekerja ${l.fit} | Sakit ${l.sk} | APD tidak lengkap ${l.ap} | APD sebagian ${l.ps} | Absen ${l.ab}\nLembur dibayar: ${F(l.lem)} jam\nUpah hari ini: ${Rp(l.up)}\nUpah kumulatif: ${Rp(m.up)} (anggaran ${Rp(m.bud)})\n\n*Catatan*\n`+al.map(a=>"- "+a[1]).join("\n")
}

function planAt(d) {
    const a = S.awal, T = S.dur, t = Math.min(1, Math.max(0, d / T));
    if (S.shape == "custom" && S.plan && S.plan.length) {
        const pts = [[0, a], ...S.plan.filter(p => p[0] > 0 && p[0] < T).sort((x, y) => x[0] - y[0]), [T, 100]];
        for (let i = 0; i < pts.length - 1; i++)
            if (d <= pts[i + 1][0]) {
                const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
                return y0 + (y1 - y0) * (d - x0) / (x1 - x0);
            }
        return 100;
    }
    if (S.shape == "s") return a + (100 - a) * (3 * t * t - 2 * t * t * t);
    return a + (100 - a) * t;
}

function parsePlan(txt, dur) {
    const plan = [];
    for (const part of txt.split(",").map(s => s.trim()).filter(Boolean)) {
        const m = part.match(/^(\d+)\s*=\s*(\d+(?:[.,]\d+)?)$/);
        if (!m) return { ok: false, err: 'Format salah pada "' + part + '". Contoh: 5=70, 10=82' };
        const d = +m[1], p = +m[2].replace(",", ".");
        if (d <= 0 || d >= dur) return { ok: false, err: "Hari harus antara 1 dan " + (dur - 1) + "." };
        if (p < 0 || p > 100) return { ok: false, err: "Persen harus antara 0 dan 100." };
        plan.push([d, p]);
    }
    plan.sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < plan.length; i++)
        if (plan[i][1] < plan[i - 1][1]) return { ok: false, err: "Persen rencana tidak boleh turun." };
    if (plan.length && plan[0][1] < S.awal) return { ok: false, err: "Persen pertama tidak boleh di bawah progres awal (" + S.awal + "%)." };
    return { ok: true, plan };
}

const STATUS_TXT = { dikirim: "Dikirim (menunggu)", dikirim_ulang: "Dikirim ulang (koreksi)", disetujui: "Disetujui", revisi: "Perlu revisi", ditolak: "Ditolak" };

function latestCorr(n) {
    let r = null;
    (S.corr || []).forEach(c => { if (c.n == n && (!r || c.k > r.k)) r = c; });
    return r;
}

function rebuildAppr() {
    const m = {};
    (S.apprLog || []).forEach(a => { if (!m[a.n] || a.ts > m[a.n].ts) m[a.n] = a; });
    S.appr = m;
}

function dayStatus(n) {
    const a = (S.appr || {})[n], c = latestCorr(n);
    if (c && (!a || c.ts > a.ts)) return { s: "dikirim_ulang", k: c.k };
    return a ? { s: a.status, note: a.note, ts: a.ts } : { s: "dikirim" };
}

function applyCorr() {
    S.days = (S.raw || []).map((r, i) => { const c = latestCorr(i + 1); return c ? c.rows : r; });
}

function normState() {
    S.raw = S.raw || S.days.slice();
    S.corr = S.corr || []; S.apprLog = S.apprLog || []; S.fin = S.fin || [];
    S.planHist = S.planHist || []; S.seals = S.seals || []; S.anggaran = S.anggaran || 0;
    S.fcfg = S.fcfg || { nilai: 0, rab: [] }; S.fcfg.rab = S.fcfg.rab || [];
    S.matm = S.matm || []; S.mat = S.mat || []; S.tasks = S.tasks || []; S.tprog = S.tprog || [];
    S.finLog = S.finLog || [];
    if (!S.finLog.length && (S.fin || []).length)
        S.finLog = S.fin.map((f, i) => ({ id: i + 1, v: 1, tgl: f.tgl, kat: f.kat, ket: f.ket, jml: f.jml, by: "Owner", role: "owner", verif: true, ts: f.ts }));
    rebuildFin();
    rebuildAppr();
    applyCorr();
}

const needOpname = () => (S.op.slice(-1)[0] || { d: 0 }).d + OPI <= S.days.length + 1;
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const lastTgl = () => { for (let i = (S.meta || []).length - 1; i >= 0; i--) if (S.meta[i] && S.meta[i].tgl) return S.meta[i].tgl; return ""; };

function dateError(tgl, prev) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl || "")) return "Isi tanggal kerja.";
    if (tgl > todayStr()) return "Tanggal kerja tidak boleh di masa depan.";
    if (prev && tgl <= prev) return "Tanggal harus setelah laporan sebelumnya (" + prev + ").";
    return null;
}

function rangeError(rows) {
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.h == 1 && r.s != 0 && r.a != 0 && r.v > VMAX * W[i][3])
            return { i, msg: "Volume " + r.v + " melebihi " + VMAX + " kali target (" + W[i][3] + " " + W[i][2] + "). Periksa angka dan satuannya." };
    }
    return null;
}

function opnameFromItems(items) {
    if (!items.length) return { ok: false, err: "Isi minimal satu item pekerjaan." };
    let tot = 0, pct = 0;
    for (const it of items) {
        if (!it.nm) return { ok: false, err: "Setiap item perlu nama pekerjaan." };
        if (!(it.vr > 0)) return { ok: false, err: 'Volume rencana "' + it.nm + '" harus lebih dari 0.' };
        if (!(it.vt >= 0)) return { ok: false, err: 'Volume terpasang "' + it.nm + '" tidak valid.' };
        if (!(it.bobot > 0)) return { ok: false, err: 'Bobot "' + it.nm + '" harus lebih dari 0.' };
        tot += it.bobot;
        pct += it.bobot * Math.min(it.vt / it.vr, 1);
    }
    if (Math.abs(tot - 100) > 0.01) return { ok: false, err: "Total bobot harus 100% (sekarang " + Math.round(tot * 100) / 100 + "%)." };
    return { ok: true, pct: Math.round(pct * 100) / 100 };
}

const KATB = ["Material", "Upah", "Peralatan / sewa alat", "Subkontraktor", "Pajak (PPN, PPh)", "Perizinan dan biaya dinas", "Pengawas / manajemen konstruksi", "Konsultan", "Overhead / operasional", "Lain-lain"];
const KAT = KATB.filter(k => k != "Upah"); // kategori yang dicatat manual (upah otomatis dari laporan harian)

const rabJml = it => it.pct > 0 ? ((S.fcfg || {}).nilai || 0) * it.pct / 100 : (it.vol || 0) * (it.harga || 0);

function rabSummary() {
    const by = {};
    KATB.forEach(k => by[k] = 0);
    ((S.fcfg || {}).rab || []).forEach(it => by[it.kat] = (by[it.kat] || 0) + rabJml(it));
    return { by, total: Object.values(by).reduce((a, b) => a + b, 0) };
}

function rebuildFin() {
    const m = {};
    (S.finLog || []).forEach(e => { if (!m[e.id] || e.v > m[e.id].v) m[e.id] = e; });
    S.fin = Object.values(m).filter(e => !e.batal).sort((a, b) => a.tgl < b.tgl ? -1 : a.tgl > b.tgl ? 1 : a.id - b.id);
}

function matStock() {
    const out = (S.matm || []).map(x => ({ ...x, masuk: 0, keluar: 0, nilai: 0 })), by = {};
    out.forEach(o => by[o.id] = o);
    (S.mat || []).forEach(e => {
        const o = by[e.mid];
        if (!o) return;
        if (e.jenis == "masuk") { o.masuk += e.qty; o.nilai += e.qty * (e.harga > 0 ? e.harga : (o.harga || 0)); }
        else o.keluar += e.qty;
    });
    out.forEach(o => { o.stok = o.masuk - o.keluar; o.status = o.stok < 0 ? "negatif" : o.stok <= (o.min || 0) ? "menipis" : "aman"; });
    return out;
}
const matCost = () => matStock().reduce((a, o) => a + o.nilai, 0);

function matAlerts() {
    const t = [];
    matStock().forEach(o => {
        if (o.stok < 0) t.push(["bad", "Stok " + o.nm + " negatif (" + o.stok + " " + o.sat + "): pemakaian lebih besar dari yang tercatat masuk."]);
        else if (o.stok <= (o.min || 0)) t.push(["wa", "Stok " + o.nm + " menipis (" + o.stok + " " + o.sat + ", batas " + (o.min || 0) + ")."]);
        if (o.keb > 0 && o.keluar > o.keb) t.push(["bad", "Pemakaian " + o.nm + " (" + o.keluar + ") melebihi kebutuhan RAB (" + o.keb + ")."]);
        else if (o.keb > 0 && o.masuk > o.keb * 1.1) t.push(["wa", "Material masuk " + o.nm + " (" + o.masuk + ") melebihi kebutuhan RAB (" + o.keb + ")."]);
    });
    return t;
}

function finSummary(m) {
    const rab = rabSummary(), nilai = (S.fcfg || {}).nilai || 0, real = {};
    KATB.forEach(k => real[k] = 0);
    real["Upah"] = m.up;
    real["Material"] = matCost();
    (S.fin || []).forEach(f => real[f.kat] = (real[f.kat] || 0) + f.jml);
    let ok = 0;
    m.cs.forEach((c, i) => { if (dayStatus(i + 1).s == "disetujui") ok += c.up; });
    const total = Object.values(real).reduce((a, b) => a + b, 0), ang = rab.total || S.anggaran || 0;
    // Estimasi laba memakai nilai material yang sudah DIPAKAI (keluar), bukan yang baru dibeli
    const beli = matCost(), dipakai = matStock().reduce((a, o) => a + (o.masuk ? o.keluar * (o.nilai / o.masuk) : 0), 0), totalPakai = total - beli + dipakai;
    const pakai = ang ? total / ang * 100 : 0, kemajuan = (m.pr - S.awal) / (100 - S.awal) * 100;
    const eac = kemajuan > 0 ? totalPakai / (kemajuan / 100) : 0;
    return {
        upah: m.up, upahOk: ok, upahPending: m.up - ok, real, rab, nilai, total, ang, sisa: ang - total, pakai, kemajuan,
        selisih: ang ? pakai - kemajuan : 0, lain: total - m.up - real["Material"], eac, totalPakai, matBeli: beli, matPakai: dipakai,
        untungRencana: nilai ? nilai - rab.total : 0, untungProyeksi: nilai && eac ? nilai - eac : 0, untungSaatIni: nilai ? nilai * kemajuan / 100 - totalPakai : 0
    };
}

const dayNum = s => Math.floor(Date.parse(s + "T00:00:00Z") / 86400000);
function lastProg(tid) {
    let r = null;
    (S.tprog || []).forEach(p => { if (p.tid == tid && (!r || p.ts > r.ts)) r = p; });
    return r;
}
function taskStatus(t, today) {
    const p = lastProg(t.id), a = p ? p.pct : 0, d0 = dayNum(t.mulai), d1 = dayNum(t.selesai), dn = dayNum(today || todayStr());
    const plan = dn <= d0 ? 0 : dn >= d1 ? 100 : (dn - d0) / (d1 - d0) * 100;
    let s, cls;
    if (a >= 100) { const late = p.aSelesai && dayNum(p.aSelesai) > d1; s = late ? "Selesai terlambat" : "Selesai"; cls = late ? "wa" : "ok"; }
    else if (dn < d0) { s = "Belum mulai"; cls = "mu"; }
    else if (dn > d1) { s = "Lewat target " + (dn - d1) + " hari"; cls = "bad"; }
    else if (plan - a > 20) { s = "Terlambat"; cls = "bad"; }
    else if (plan - a > 5) { s = "Terlambat ringan"; cls = "wa"; }
    else { s = "Sesuai jadwal"; cls = "ok"; }
    return { s, cls, plan, aktual: a, p };
}
const tasksLate = today => (S.tasks || []).filter(t => { const x = taskStatus(t, today); return x.cls == "bad" || x.s == "Terlambat ringan"; }).length;

function todo(m) {
    const t = [], n = m.n;
    const st = Array.from({ length: n }, (_, i) => dayStatus(i + 1).s);
    const wait = st.filter(s => s == "dikirim" || s == "dikirim_ulang").length;
    if (wait) t.push(["wa", wait + " laporan harian menunggu persetujuan.", "a"]);
    const rev = st.filter(s => s == "revisi" || s == "ditolak").length;
    if (rev) t.push(["wa", rev + " laporan menunggu koreksi dari supervisor.", "a"]);
    if (needOpname()) t.push(["bad", "Opname sudah jatuh tempo. Supervisor tidak bisa menyimpan laporan berikutnya.", "o"]);
    const lt = lastTgl();
    if (n && lt && lt < todayStr() && m.pr < 100) t.push(["wa", "Belum ada laporan untuk hari ini (laporan terakhir: " + lt + ").", "d"]);
    if (n && (m.lv == "bad" || m.lv == "wa")) t.push([m.lv, "Status jadwal: " + m.tx + ".", "d"]);
    const f = finSummary(m);
    if (f.ang && f.pakai >= 90) t.push(["bad", "Biaya terpakai " + Math.round(f.pakai) + "% dari anggaran.", "k"]);
    else if (f.ang && f.selisih > 10) t.push(["wa", "Biaya terpakai lebih cepat dari kemajuan pekerjaan (selisih " + Math.round(f.selisih) + " poin).", "k"]);
    const mt = matAlerts();
    if (mt.length) t.push([mt.some(x => x[0] == "bad") ? "bad" : "wa", mt.length + " peringatan material (stok atau kebutuhan RAB).", "m"]);
    const tl = tasksLate();
    if (tl) t.push(["wa", tl + " pekerjaan terlambat dari jadwal.", "j"]);
    const uv = (S.fin || []).filter(f => !f.verif).length;
    if (uv) t.push(["wa", uv + " catatan biaya dari supervisor menunggu verifikasi.", "k"]);
    const fl = n >= 3 ? flags(m) : [];
    if (fl.length) t.push(["wa", fl.length + " indikasi kejanggalan data perlu diperiksa.", "d"]);
    return t;
}

const SHA_P = [];
for (let n = 2; SHA_P.length < 64; n++) if (SHA_P.every(p => n % p)) SHA_P.push(n);
const SHA_FR = x => Math.floor((x - Math.floor(x)) * 4294967296);
const SHA_K = SHA_P.map(p => SHA_FR(Math.cbrt(p)));
const SHA_H0 = SHA_P.slice(0, 8).map(p => SHA_FR(Math.sqrt(p)));

function sha256js(str) {
    const bytes = [...new TextEncoder().encode(str)];
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 != 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 255);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    let H = SHA_H0.slice();
    for (let o = 0; o < bytes.length; o += 64) {
        const w = [];
        for (let i = 0; i < 16; i++)
            w[i] = (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + SHA_K[i] + w[i]) | 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + mj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H = H.map((v, i) => (v + [a, b, c, d, e, f, g, h][i]) | 0);
    }
    return H.map(v => (v >>> 0).toString(16).padStart(8, "0")).join("");
}

const pinValid = p => /^\d{4,8}$/.test(p);
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

async function pinHash(pin, salt, v) {
    v = v || (typeof crypto !== "undefined" && crypto.subtle ? "p" : "j");
    if (v == "p") {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
        const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 120000 }, key, 256);
        return toHex(bits);
    }
    let h = sha256js(salt + "|" + pin);
    for (let i = 0; i < 5000; i++) h = sha256js(h + salt + pin);
    return h;
}

async function makePin(pin) {
    const s = toHex(crypto.getRandomValues(new Uint8Array(12)));
    const v = typeof crypto !== "undefined" && crypto.subtle ? "p" : "j";
    return { s, v, h: await pinHash(pin, s, v) };
}

async function checkPin(pin, rec) {
    if (!rec || !rec.h) return false;
    try { return (await pinHash(pin, rec.s, rec.v || "j")) === rec.h; } catch (e) { return false; }
}
function csv(rows) {
    return "\uFEFF" + rows.map(r => r.map(c => {
        const s = String(c === undefined || c === null ? "" : c);
        return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(";")).join("\r\n");
}

function anonName(i) { return "Pekerja " + (i + 1); }
function anonBy(by, map) { if (!(by in map)) map[by] = "Pengisi " + String.fromCharCode(65 + Object.keys(map).length); return map[by]; }

function csvRekap(m, a, b, anon) {
    a = a || 1; b = b || m.n;
    const mp = {}, r = [["hari", "tanggal", "pengisi", "status", "pekerja_bekerja", "sakit", "apd_tidak_lengkap", "apd_sebagian", "absen", "jam_lembur_dibayar", "rata_kpi", "upah_total", "progres_kumulatif_sistem"]];
    m.cs.forEach((c, i) => {
        if (i + 1 < a || i + 1 > b) return;
        const mt = S.meta[i] || {};
        r.push([i + 1, mt.tgl || "", anon ? anonBy(mt.by || "", mp) : mt.by || "", STATUS_TXT[dayStatus(i + 1).s], c.fit, c.sk, c.ap, c.ps, c.ab, c.lem, Math.round(c.rk * 10) / 10, Math.round(c.up), Math.round(c.prog * 100) / 100]);
    });
    return csv(r);
}

function csvPekerja(m, a, b, anon) {
    a = a || 1; b = b || m.n;
    const r = [["hari", "tanggal", "pekerja", "zona", "status", "volume", "satuan", "target", "rasio_persen", "kpi", "upah_pokok", "lembur", "bonus", "potongan", "upah_total"]];
    m.cs.forEach((c, i) => c.o.forEach((o, j) => {
        if (i + 1 < a || i + 1 > b) return;
        const row = (S.days[i] || [])[j] || {}, w = W[j] || ["?", "", "", ""];
        r.push([i + 1, (S.meta[i] || {}).tgl || "", anon ? anonName(j) : w[0], w[1], ST[o.st], o.st == 1 ? row.v : "", w[2], w[3], o.st == 1 ? Math.round(o.ra * 100) : "", o.st == 1 ? Math.round(o.kpi * 10) / 10 : "", o.pk, Math.round(o.lm), o.bn, o.pt, Math.round(o.up)]);
    }));
    return csv(r);
}

function csvMaterial() {
    const r = [["tanggal", "material", "satuan", "jenis", "jumlah", "harga_satuan", "nilai", "keterangan", "dicatat_oleh"]], by = {};
    (S.matm || []).forEach(x => by[x.id] = x);
    (S.mat || []).forEach(e => { const x = by[e.mid] || { nm: "?", sat: "" }, h = e.harga > 0 ? e.harga : (x.harga || 0); r.push([e.tgl, x.nm, x.sat, e.jenis, e.qty, h, e.jenis == "masuk" ? Math.round(e.qty * h) : "", e.ket, e.by]); });
    r.push([], ["RINGKASAN STOK", "satuan", "masuk", "keluar", "stok", "batas_minimum", "kebutuhan_rab", "status"]);
    matStock().forEach(o => r.push([o.nm, o.sat, o.masuk, o.keluar, o.stok, o.min || 0, o.keb || 0, o.status]));
    return csv(r);
}

function csvJadwal() {
    const r = [["pekerjaan", "mulai_rencana", "selesai_rencana", "rencana_persen_hari_ini", "realisasi_persen", "status", "catatan_terakhir"]];
    (S.tasks || []).forEach(t => { const x = taskStatus(t); r.push([t.nm, t.mulai, t.selesai, Math.round(x.plan), x.aktual, x.s, x.p ? x.p.cat || "" : ""]); });
    return csv(r);
}

function csvOpname() {
    const r = [["opname_ke", "setelah_hari", "tanggal", "progres_persen", "pemeriksa", "item", "lokasi", "satuan", "volume_rencana", "volume_terpasang", "bobot_persen", "capaian_persen"]];
    (S.op || []).forEach((o, k) => {
        if (!(o.items || []).length) r.push([k + 1, o.d, o.tgl || "", o.v, o.by, "", "", "", "", "", "", ""]);
        (o.items || []).forEach(it => r.push([k + 1, o.d, o.tgl || "", o.v, o.by, it.nm, it.lok || "", it.sat || "", it.vr, it.vt, it.bobot, Math.round(Math.min(it.vt / it.vr, 1) * 1000) / 10]));
    });
    return csv(r);
}

function csvBiaya(m) {
    const f = finSummary(m);
    const r = [["kategori", "rab", "realisasi", "selisih"]];
    KATB.forEach(k => r.push([k, Math.round(f.rab.by[k]), Math.round(f.real[k]), Math.round(f.rab.by[k] - f.real[k])]));
    r.push(["TOTAL", Math.round(f.rab.total), Math.round(f.total), Math.round(f.rab.total - f.total)], ["NILAI KONTRAK", f.nilai], ["ESTIMASI KEUNTUNGAN SAAT INI", Math.round(f.untungSaatIni)], ["PROYEKSI KEUNTUNGAN AKHIR", Math.round(f.untungProyeksi)], [], ["tanggal", "kategori", "keterangan", "jumlah", "dicatat_oleh", "terverifikasi"]);
    (S.fin || []).forEach(x => r.push([x.tgl, x.kat, x.ket, x.jml, x.by || "", x.verif ? "ya" : "belum"]));
    return csv(r);
}

function seriesRange(m, a, b) {
    const idx = [];
    for (let i = Math.max(1, a); i <= b && i <= m.n; i++) idx.push(i);
    const c = i => m.cs[i - 1];
    return {
        labels: idx,
        prog: idx.map(i => c(i).prog),
        upah: idx.map(i => c(i).up),
        kpi: idx.map(i => c(i).rk),
        hadir: idx.map(i => Math.round(c(i).fit / (S.days[i - 1].length || 1) * 100)),
        ringkas: {
            hari: idx.length,
            upah: idx.reduce((s, i) => s + c(i).up, 0),
            lembur: idx.reduce((s, i) => s + c(i).lem, 0),
            kpi: idx.length ? idx.reduce((s, i) => s + c(i).rk, 0) / idx.length : 0,
            apd: idx.reduce((s, i) => s + c(i).ap + c(i).ps, 0),
            sakit: idx.reduce((s, i) => s + c(i).sk, 0),
            absen: idx.reduce((s, i) => s + c(i).ab, 0)
        }
    };
}

function logAdd(t) {
    S.log = S.log || [];
    S.log.push({ ts: new Date().toISOString(), t });
}
const logText = x => typeof x == "string" ? x : new Date(x.ts).toLocaleString("id-ID") + " – " + x.t;

function activity() {
    const ev = [];
    (S.meta || []).forEach((mt, i) => ev.push({ ts: mt.iso || "", who: mt.by, txt: "Laporan hari ke-" + (i + 1) + " dikirim" + (mt.tgl ? " (tanggal " + mt.tgl + ")" : "") }));
    (S.corr || []).forEach(c => ev.push({ ts: c.ts, who: c.by, txt: "Koreksi hari ke-" + c.n + " (versi " + c.k + "): " + c.alasan }));
    (S.apprLog || []).forEach(a => ev.push({ ts: a.ts, who: "Owner", txt: "Hari ke-" + a.n + ": " + STATUS_TXT[a.status] + (a.note ? " (" + a.note + ")" : "") }));
    (S.op || []).forEach(o => ev.push({ ts: o.ts || "", who: o.by, txt: "Opname setelah hari ke-" + o.d + ": " + o.v + "%" + ((o.items || []).length ? " (" + o.items.length + " item)" : "") }));
    (S.seals || []).forEach(s => ev.push({ ts: s.ts || "", who: s.by, txt: "Data disegel sampai hari ke-" + s.d }));
    (S.finLog || []).forEach(f => ev.push({ ts: f.ts || "", who: f.by || "Owner", txt: (f.batal ? "Biaya dibatalkan" : f.v > 1 ? "Biaya diubah" : "Biaya dicatat") + ": " + f.kat + " - " + f.ket + " (" + Rp(f.jml) + ")" }));
    (S.mat || []).forEach(x => ev.push({ ts: x.ts || "", who: x.by, txt: "Material " + x.jenis + ": " + x.qty + " " + ((S.matm || []).find(y => y.id == x.mid) || { nm: "?" }).nm }));
    (S.tprog || []).forEach(p => ev.push({ ts: p.ts || "", who: p.by, txt: "Progres pekerjaan " + ((S.tasks || []).find(t => t.id == p.tid) || { nm: "?" }).nm + ": " + p.pct + "%" }));
    (S.log || []).forEach(x => { if (typeof x == "object") ev.push({ ts: x.ts, who: "Owner", txt: x.t }); });
    return ev.filter(e => e.ts).sort((a, b) => a.ts < b.ts ? 1 : -1);
}

function pearson(x, y) {
    const n = x.length;
    if (n < 3) return null;
    const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; }
    return sx && sy ? sxy / Math.sqrt(sx * sy) : null;
}

function kpiAnalysis(m, a, b) {
    const per = W.map(w => ({ nm: w[0], hari: 0, rasio: 0, kpi: 0, apd: 0, absen: 0, sakit: 0 })), xs = [], k3 = [], tl = [];
    for (let i = a; i <= b && i <= m.n; i++)
        m.cs[i - 1].o.forEach((o, j) => {
            const p = per[j];
            if (!p) return;
            if (o.st == 1) { p.hari++; p.rasio += o.ra; p.kpi += o.kpi; xs.push(o.ra); k3.push(o.kd); tl.push(o.kt); }
            if (o.st == 3 || (o.st == 1 && ((S.days[i - 1] || [])[j] || {}).a == 1)) p.apd++;
            if (o.st == 0) p.absen++;
            if (o.st == 2) p.sakit++;
        });
    per.forEach(p => { if (p.hari) { p.rasio /= p.hari; p.kpi /= p.hari; } });
    return { per, rK3: pearson(xs, k3), rTeliti: pearson(xs, tl), n: xs.length };
}

function periodRange(type, m, arg) {
    const n = m.n;
    if (type == "harian") return [arg, arg];
    if (type == "mingguan") return [(arg - 1) * 7 + 1, Math.min(n, arg * 7)];
    if (type == "bulanan") {
        const idx = [];
        for (let i = 1; i <= n; i++) if (((S.meta[i - 1] || {}).tgl || "").startsWith(arg)) idx.push(i);
        return idx.length ? [idx[0], idx[idx.length - 1]] : [1, 0];
    }
    return [1, n];
}

function reportLines(m, type, arg) {
    const [a, b] = periodRange(type, m, arg), s = seriesRange(m, a, b), r = s.ringkas, f = finSummary(m);
    const jd = { harian: "Laporan Harian", mingguan: "Laporan Mingguan", bulanan: "Laporan Bulanan", akhir: "Rekap Akhir Proyek" }[type];
    const L = [jd + " - " + (S.nama || "Proyek"), "Dibuat: " + new Date().toLocaleString("id-ID"), "Periode: hari ke-" + a + " sampai " + b, ""];
    L.push("RINGKASAN", "Hari dilaporkan        : " + r.hari, "Total upah             : " + Rp(r.upah), "Jam lembur dibayar     : " + F(r.lembur), "Rata-rata KPI          : " + F(r.kpi), "Kasus APD bermasalah   : " + r.apd, "Sakit / absen (orang-hari): " + r.sakit + " / " + r.absen, "Progres sistem sekarang: " + F(m.pr) + "% (rencana " + F(m.ren) + "%), status: " + m.tx, "");
    L.push("RINCIAN PER HARI", "Hari | Tanggal    | Bekerja | Upah          | KPI   | Status laporan");
    for (let i = a; i <= b && i <= m.n; i++) { const c = m.cs[i - 1]; L.push(i + " | " + ((S.meta[i - 1] || {}).tgl || "-") + " | " + c.fit + "/" + S.days[i - 1].length + " | " + Rp(c.up) + " | " + F(c.rk) + " | " + STATUS_TXT[dayStatus(i).s]); }
    L.push("", "BIAYA (RAB vs REALISASI, SELURUH PROYEK)");
    KATB.forEach(k => { if (f.rab.by[k] || f.real[k]) L.push(k + ": RAB " + Rp(f.rab.by[k]) + ", realisasi " + Rp(f.real[k])); });
    L.push("TOTAL: RAB " + Rp(f.rab.total) + ", realisasi " + Rp(f.total) + ", sisa " + Rp(f.sisa));
    if (f.nilai) L.push("Nilai kontrak " + Rp(f.nilai) + "; estimasi keuntungan saat ini " + Rp(f.untungSaatIni) + "; proyeksi akhir " + Rp(f.untungProyeksi));
    L.push("", "MATERIAL (stok)");
    matStock().forEach(o => L.push(o.nm + ": masuk " + o.masuk + ", keluar " + o.keluar + ", stok " + o.stok + " " + o.sat + " (" + o.status + ")"));
    L.push("", "JADWAL PEKERJAAN");
    (S.tasks || []).forEach(t => { const x = taskStatus(t); L.push(t.nm + ": rencana " + Math.round(x.plan) + "%, realisasi " + x.aktual + "%, " + x.s); });
    const op = (S.op || []).slice(-1)[0];
    if (op) L.push("", "OPNAME TERAKHIR: setelah hari ke-" + op.d + ", " + op.v + "% oleh " + (op.by || "-"));
    return L;
}

function makePdf(title, lines) {
    const clean = s => String(s).replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
    const esc = s => clean(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const wrap = (s, w) => { const o = []; s = clean(s); while (s.length > w) { let c = s.lastIndexOf(" ", w); if (c < w * 0.5) c = w; o.push(s.slice(0, c)); s = "    " + s.slice(c).trim(); } o.push(s); return o; };
    const all = [];
    lines.forEach(l => wrap(l, 92).forEach(x => all.push(x)));
    const per = 52, pages = [];
    for (let i = 0; i < all.length; i += per) pages.push(all.slice(i, i + per));
    if (!pages.length) pages.push([""]);
    const objs = [];
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[2] = "<< /Type /Pages /Kids [" + pages.map((_, i) => (6 + 2 * i) + " 0 R").join(" ") + "] /Count " + pages.length + " >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    pages.forEach((pg, i) => {
        const head = i == 0 ? "BT /F2 13 Tf 50 800 Td (" + esc(title) + ") Tj ET\n" : "BT /F1 8 Tf 50 815 Td (" + esc(title) + " - halaman " + (i + 1) + ") Tj ET\n";
        const body = "BT /F1 9.5 Tf 13 TL 50 " + (i == 0 ? 780 : 795) + " Td\n" + pg.map(x => "(" + esc(x) + ") Tj T*").join("\n") + "\nET";
        const stream = head + body;
        objs[5 + 2 * i] = "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream";
        objs[6 + 2 * i] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + (5 + 2 * i) + " 0 R >>";
    });
    let out = "%PDF-1.4\n";
    const off = [];
    for (let i = 1; i < objs.length; i++) { off[i] = out.length; out += i + " 0 obj\n" + objs[i] + "\nendobj\n"; }
    const xr = out.length;
    out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n" + off.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + "trailer\n<< /Size " + objs.length + " /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF";
    return Uint8Array.from(out, ch => ch.charCodeAt(0) & 255);
}

function checkBackup(txt) {
    let j;
    try { j = JSON.parse(txt); } catch (e) { return { ok: false, err: "Isi bukan JSON yang valid." }; }
    if (!j || !Array.isArray(j.hari) || !j.proyek) return { ok: false, err: "Struktur cadangan tidak dikenali (butuh proyek dan hari)." };
    return { ok: true, hari: j.hari.length, opname: (j.opname || []).length, koreksi: (j.koreksi || []).length, biaya: (j.keuangan || []).length };
}
function demo() {
    let s=11;
    const r=()=>(s=(s*9301+49297)%233280)/233280,q=()=> {
        const y=r();
        return y<.15?0:y<.5?1:2
    };
    S.days=[];
    for(let d=0;d<6;d++)S.days.push(W.map((_,i)=> {
        const x=r();
        if(i==4)return{h:1,s:2,a:2,v:9,t:2,d:2,l:240};
        return x<.08?{h:0}:x<.15?{h:1,s:0,a:2,sd:x<.12?1:0}:x<.22?{h:1,s:2,a:0,ar:x<.18?1:0}:x<.3?{h:1,s:1,a:2,v:Math.round(W[i][3]*.8*10)/10,t:q(),d:q(),l:60}:x<.38?{h:1,s:2,a:1,v:Math.round(W[i][3]*.9*10)/10,t:q(),d:q(),l:0}:{h:1,s:2,a:2,v:Math.round(W[i][3]*(.7+r()*.5)*10)/10,t:Math.max(1,q()),d:Math.max(1,q()),l:Math.floor(r()*9)*30}
    }));
    const tg = k => new Date(Date.now() - new Date().getTimezoneOffset() * 60000 - (6 - k) * 86400000).toISOString().slice(0, 10);
    S.meta = S.days.map((_, k) => ({ ts: "Data contoh", iso: tg(k) + "T08:00:00.000Z", by: "Supervisor (contoh)", tgl: tg(k) }));
    S.raw = null; S.corr = []; S.seals = []; S.planHist = []; S.log = [];
    S.apprLog = [1, 2, 3].map(n => ({ n, status: "disetujui", note: "", ts: tg(n - 1) + "T12:00:00.000Z", by: "Owner" }));
    S.apprLog.push({ n: 4, status: "revisi", note: "Volume Pak Rahmat tampak terlalu tinggi, cek ukuran di lapangan.", ts: tg(3) + "T12:00:00.000Z", by: "Owner" });
    S.anggaran = 0;
    const dd = off => new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + off * 86400000).toISOString().slice(0, 10);
    const ts = (off, h) => dd(off) + "T" + h + ":00:00.000Z", sup = "Supervisor (contoh)";
    S.fcfg = { nilai: 85000000, rab: [
        { kat: "Material", uraian: "Semen PC 50 kg", vol: 200, sat: "sak", harga: 68000 },
        { kat: "Material", uraian: "Pasir pasang", vol: 40, sat: "m3", harga: 280000 },
        { kat: "Material", uraian: "Besi beton", vol: 1200, sat: "kg", harga: 15000 },
        { kat: "Upah", uraian: "Upah pekerja (orang-hari)", vol: 70, sat: "OH", harga: 150000 },
        { kat: "Peralatan / sewa alat", uraian: "Sewa scaffolding", vol: 1, sat: "paket", harga: 3000000 },
        { kat: "Pajak (PPN, PPh)", uraian: "PPh final (contoh tarif 2% dari nilai kontrak)", pct: 2 },
        { kat: "Perizinan dan biaya dinas", uraian: "Perizinan dan biaya dinas", vol: 1, sat: "paket", harga: 1500000 },
        { kat: "Pengawas / manajemen konstruksi", uraian: "Pengawas lapangan", vol: 1, sat: "paket", harga: 2500000 },
        { kat: "Konsultan", uraian: "Konsultan pengawas", vol: 1, sat: "paket", harga: 2000000 },
        { kat: "Overhead / operasional", uraian: "Operasional proyek", vol: 1, sat: "paket", harga: 3000000 }] };
    S.matm = [
        { id: "m1", nm: "Semen PC 50 kg", sat: "sak", min: 20, keb: 200, harga: 68000 },
        { id: "m2", nm: "Pasir pasang", sat: "m3", min: 5, keb: 40, harga: 280000 },
        { id: "m3", nm: "Besi beton", sat: "kg", min: 150, keb: 1200, harga: 15000 }];
    S.mat = [
        { k: 1, tgl: dd(-5), mid: "m1", jenis: "masuk", qty: 100, harga: 68500, ket: "Toko Bangunan Maju, nota 118", by: sup, ts: ts(-5, "08") },
        { k: 2, tgl: dd(-4), mid: "m1", jenis: "keluar", qty: 40, harga: 0, ket: "Pengecoran kolom lantai 2", by: sup, ts: ts(-4, "15") },
        { k: 3, tgl: dd(-2), mid: "m1", jenis: "keluar", qty: 45, harga: 0, ket: "Plesteran dan pengecoran balok", by: sup, ts: ts(-2, "15") },
        { k: 4, tgl: dd(-5), mid: "m2", jenis: "masuk", qty: 20, harga: 275000, ket: "CV Pasir Jaya, nota 77", by: sup, ts: ts(-5, "09") },
        { k: 5, tgl: dd(-3), mid: "m2", jenis: "keluar", qty: 5, harga: 0, ket: "Pengecoran kolom", by: sup, ts: ts(-3, "15") },
        { k: 6, tgl: dd(-5), mid: "m3", jenis: "masuk", qty: 800, harga: 15200, ket: "UD Besi Baja, nota 502", by: sup, ts: ts(-5, "10") },
        { k: 7, tgl: dd(-1), mid: "m3", jenis: "keluar", qty: 400, harga: 0, ket: "Pembesian kolom dan balok", by: sup, ts: ts(-1, "15") }];
    S.tasks = [
        { id: 1, nm: "Pembesian kolom lantai 2", mulai: dd(-9), selesai: dd(2) },
        { id: 2, nm: "Pengecoran balok", mulai: dd(-5), selesai: dd(5) },
        { id: 3, nm: "Bekisting plat lantai", mulai: dd(-2), selesai: dd(9) },
        { id: 4, nm: "Plesteran dinding", mulai: dd(4), selesai: dd(14) }];
    S.tprog = [
        { k: 1, tid: 1, pct: 85, cat: "Kolom grid A-C selesai dibesi", by: sup, ts: ts(-1, "16") },
        { k: 2, tid: 2, pct: 25, cat: "Baru satu bentang dicor", by: sup, ts: ts(-1, "16") },
        { k: 3, tid: 3, pct: 5, cat: "Persiapan bekisting", by: sup, ts: ts(-1, "16") }];
    S.fin = [];
    S.finLog = [
        { id: 1, v: 1, tgl: dd(-4), kat: "Peralatan / sewa alat", ket: "Sewa scaffolding minggu 1", jml: 1500000, by: sup, role: "sup", verif: false, ts: ts(-4, "17") },
        { id: 2, v: 1, tgl: dd(-3), kat: "Perizinan dan biaya dinas", ket: "Biaya izin dan retribusi", jml: 1500000, by: "Owner", role: "owner", verif: true, ts: ts(-3, "10") },
        { id: 3, v: 1, tgl: dd(-1), kat: "Overhead / operasional", ket: "BBM genset dan air kerja", jml: 450000, by: sup, role: "sup", verif: true, ts: ts(-1, "17") }];
    S.op = [];
    normState();
    const m = M();
    S.op = [{ d: 6, v: 74.5, by: "QC (contoh)", tgl: tg(5), ts: tg(5) + "T15:00:00.000Z", items: [
        { nm: "Pembesian kolom lantai 2", lok: "Grid A-C", sat: "kg", vr: 1500, vt: 1200, bobot: 30 },
        { nm: "Pengecoran balok", lok: "Lantai 2", sat: "m3", vr: 40, vt: 28, bobot: 40 },
        { nm: "Bekisting plat", lok: "Lantai 2", sat: "m2", vr: 200, vt: 150, bobot: 30 }] }];
}

const nowIso = () => new Date().toISOString();
const nextK = list => (list.length ? Math.max(...list.map(x => x.k || 0)) + 1 : 1);

function toast(t) {
    const e = $("#toast");
    e.textContent = t;
    e.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => e.hidden = true, 6000);
}

function download(name, data, mime) {
    const url = URL.createObjectURL(new Blob([data], { type: mime || "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function apiCommitDay(rows, by, tgl) {
    S.raw.push(rows);
    S.meta.push({ ts: new Date().toLocaleString("id-ID"), iso: nowIso(), by, tgl, photos: [] });
    applyCorr();
    save();
}
async function apiCommitCorr(n, rows, by, alasan) {
    const k = S.corr.filter(c => c.n == n).length + 1;
    S.corr.push({ n, k, rows: JSON.parse(JSON.stringify(rows)), by, alasan, ts: nowIso() });
    applyCorr();
    save();
}
async function apiCommitAppr(n, status, note) {
    S.apprLog.push({ n, status, note, ts: nowIso(), by: "Owner" });
    rebuildAppr();
    save();
}
async function apiCommitOp(v, by, items, tgl) {
    S.op.push({ d: S.days.length, v, by, items, tgl, ts: nowIso() });
    save();
}
async function apiAddFin(e) {
    const id = Math.max(0, ...S.finLog.map(x => x.id)) + 1;
    S.finLog.push({ id, v: 1, ...e, ts: nowIso() });
    rebuildFin();
    save();
}
async function apiEditFin(id, patch) {
    const vs = S.finLog.filter(x => x.id == id).sort((a, b) => b.v - a.v);
    if (!vs.length) throw new Error("Catatan biaya tidak ditemukan.");
    S.finLog.push({ ...vs[0], ...patch, id, v: vs[0].v + 1, ts: nowIso() });
    rebuildFin();
    save();
}
async function apiAddMat(e) { S.mat.push({ k: nextK(S.mat), ...e, ts: nowIso() }); save(); }
async function apiAddProg(e) { S.tprog.push({ k: nextK(S.tprog), ...e, ts: nowIso() }); save(); }
async function apiSaveFcfg() { save(); }
async function apiSaveMatm() { save(); }
async function apiSaveTasks() { save(); }

const RL = { owner: "Owner", sup: "Supervisor" };
const IDLE_MS = 10 * 60 * 1000;
const fails = { owner: 0, sup: 0 }, lockUntil = { owner: 0, sup: 0 };
let idleTimer = null;
async function pinRecord(r) { return (S.pins && S.pins[r]) || null; }

async function pinStore(r, rec) { S.pins = S.pins || {}; S.pins[r] = rec; save(); }

function gate(r) {
    role = null;
    clearTimeout(idleTimer);
    ["#t-d", "#t-a", "#t-o", "#t-k", "#t-m", "#t-j", "#t-n", "#t-r", "#t-y", "#cf", "#hs"].forEach(s => $(s).innerHTML = "");
    $("#rp").value = "";
    $("#gate").style.display = "block";
    $("#app").style.display = "none";
    if (r) loginStep(r); else chooseRole();
}

function chooseRole() {
    $("#gate").innerHTML = `<div class="card"><h2>Masuk sebagai</h2>
      <div class="row"><button class="btn" id="r1">Owner / Pemilik Proyek</button><button class="btn g" id="r2">Supervisor Lapangan</button></div>
      <div class="sub">Owner dan Supervisor memakai PIN yang berbeda. Supervisor tidak dapat masuk sebagai Owner. Data tersimpan di browser perangkat ini.</div></div>`;
    $("#r1").onclick = () => gate("owner");
    $("#r2").onclick = () => gate("sup");
}

function blocked(t) {
    $("#gate").innerHTML = `<div class="card"><h2>Tidak dapat masuk</h2><div class="al wa">${esc(t)}</div><div class="row"><button class="btn g" id="bk">Kembali</button></div></div>`;
    $("#bk").onclick = () => gate();
}

async function loginStep(r) {
    $("#gate").innerHTML = '<div class="card"><div class="sub">Memeriksa…</div></div>';
    const rec = await pinRecord(r);
    if (r == "owner" && !rec) return setupStep(false);
    if (r == "sup" && !rec)
        return blocked("PIN Supervisor belum dibuat. Minta Owner masuk lebih dulu: Owner membuat PIN Supervisor saat pertama kali masuk, dan dapat mengubahnya di Pengaturan, bagian Keamanan.");
    pinPrompt(r, rec);
}

function pinField(id, label, w) {
    return `<label>${label}<input id="${id}" type="password" inputmode="numeric" maxlength="8" autocomplete="off"${w ? ' style="width:' + w + 'px"' : ""}></label>`;
}

function pinPrompt(r, rec) {
    $("#gate").innerHTML = `<div class="card"><h2>Masuk sebagai ${RL[r]}</h2>
      <div class="row">${pinField("pn", "PIN " + RL[r], 160)}<button class="btn" id="go">Masuk</button><button class="btn g" id="bk">Kembali</button></div>
      <div class="er-msg" id="gm"></div>${r == "owner" ? '<div class="sub"><a href="#" id="fg">Lupa PIN Owner?</a></div>' : ""}</div>`;
    const m = $("#gm");
    const attempt = async () => {
        const wait = Math.ceil((lockUntil[r] - Date.now()) / 1000);
        if (wait > 0) { m.textContent = "Terlalu banyak percobaan salah. Coba lagi dalam " + wait + " detik."; return; }
        const v = $("#pn").value;
        if (!pinValid(v)) { m.textContent = "PIN harus 4 sampai 8 angka."; return; }
        $("#go").disabled = true;
        const ok = await checkPin(v, rec);
        $("#go").disabled = false;
        if (ok) { fails[r] = 0; enter(r); return; }
        if (++fails[r] >= 5) { lockUntil[r] = Date.now() + 30000; fails[r] = 0; m.textContent = "PIN salah 5 kali. Dikunci 30 detik."; }
        else m.textContent = "PIN salah. Sisa percobaan: " + (5 - fails[r]) + ".";
        $("#pn").value = "";
    };
    $("#go").onclick = attempt;
    $("#pn").addEventListener("keydown", e => { if (e.key == "Enter") attempt(); });
    $("#bk").onclick = () => gate();
    if ($("#fg")) $("#fg").onclick = e => { e.preventDefault(); forgot(); };
}

function setupStep(reset) {
    $("#gate").innerHTML = `<div class="card"><h2>${reset ? "Atur ulang PIN" : "Pengaturan awal keamanan"}</h2>
      <div class="sub" style="margin-bottom:8px">Buat dua PIN yang berbeda (4 sampai 8 angka): PIN Owner untuk pemilik proyek dan PIN Supervisor untuk petugas lapangan. Berikan PIN Supervisor hanya kepada supervisor.</div>
      <div class="g">${pinField("o1", "PIN Owner")}${pinField("o2", "Ulangi PIN Owner")}${pinField("s1", "PIN Supervisor")}${pinField("s2", "Ulangi PIN Supervisor")}</div>
      <div class="row" style="margin-top:10px"><button class="btn" id="sv0">Simpan dan masuk</button><button class="btn g" id="bk">Kembali</button></div><div class="er-msg" id="gm"></div></div>`;
    $("#sv0").onclick = async () => {
        const a = $("#o1").value, b = $("#o2").value, c = $("#s1").value, d = $("#s2").value, m = $("#gm");
        if (!pinValid(a) || !pinValid(c)) { m.textContent = "Kedua PIN harus 4 sampai 8 angka."; return; }
        if (a !== b || c !== d) { m.textContent = "Pengulangan PIN tidak sama."; return; }
        if (a === c) { m.textContent = "PIN Owner dan PIN Supervisor harus berbeda."; return; }
        try {
            await pinStore("owner", await makePin(a));
            await pinStore("sup", await makePin(c));
        } catch (x) { m.textContent = "Gagal menyimpan PIN: " + ((x && x.message) || x); return; }
        enter("owner");
    };
    $("#bk").onclick = () => gate();
}

function forgot() {
    $("#gate").innerHTML = `<div class="card"><h2>Lupa PIN Owner</h2>
      <div class="al bad">PIN tidak dapat dipulihkan. Mengatur ulang akan menghapus SEMUA data di perangkat ini (hari, opname, riwayat, PIN). Ketik HAPUS untuk melanjutkan.</div>
      <div class="row"><label>Konfirmasi<input id="cf1" style="width:140px" autocomplete="off"></label><button class="btn" id="fgo">Hapus dan atur ulang</button><button class="btn g" id="bk">Batal</button></div><div class="er-msg" id="gm"></div></div>`;
    $("#fgo").onclick = () => {
        if ($("#cf1").value.trim() != "HAPUS") { $("#gm").textContent = "Ketik HAPUS (huruf besar) untuk konfirmasi."; return; }
        S.days = []; S.raw = []; S.meta = []; S.op = []; S.corr = []; S.apprLog = []; S.fin = []; S.seals = []; S.anggaran = 0; S.pins = null; S.log = []; normState(); save();
        setupStep(true);
    };
    $("#bk").onclick = () => gate();
}

function idleReset() {
    clearTimeout(idleTimer);
    if (role) idleTimer = setTimeout(() => { gate(); toast("Sesi berakhir karena tidak aktif. Silakan masuk lagi."); }, IDLE_MS);
}
["pointerdown", "keydown", "input", "scroll"].forEach(ev => document.addEventListener(ev, idleReset, { passive: true }));

function secHTML() {
    return `<div class="card" id="sec-aman"><h2>Keamanan (PIN)</h2>
      <div class="sub" style="margin-bottom:8px">Owner dan Supervisor memakai PIN berbeda. Supervisor tidak dapat masuk sebagai Owner. Jika PIN Supervisor bocor, atur ulang di sini.</div>
      <div class="g">${pinField("k1", "PIN Owner lama")}${pinField("k2", "PIN Owner baru")}${pinField("k3", "Ulangi PIN Owner baru")}</div>
      <div class="row" style="margin-top:8px"><button class="btn g" id="cpo">Ubah PIN Owner</button></div>
      <div class="g" style="margin-top:8px">${pinField("k4", "PIN Supervisor baru")}${pinField("k5", "Ulangi PIN Supervisor baru")}</div>
      <div class="row" style="margin-top:8px"><button class="btn g" id="cps">Atur ulang PIN Supervisor</button></div><div class="er-msg" id="km"></div></div>`;
}

async function changeOwnerPin() {
    const m = $("#km"), old = $("#k1").value, n = $("#k2").value, n2 = $("#k3").value;
    m.textContent = "";
    if (!(await checkPin(old, await pinRecord("owner")))) { m.textContent = "PIN Owner lama salah."; return; }
    if (!pinValid(n)) { m.textContent = "PIN baru harus 4 sampai 8 angka."; return; }
    if (n !== n2) { m.textContent = "Pengulangan PIN baru tidak sama."; return; }
    if (await checkPin(n, await pinRecord("sup"))) { m.textContent = "PIN Owner tidak boleh sama dengan PIN Supervisor."; return; }
    await pinStore("owner", await makePin(n));
    ["k1", "k2", "k3"].forEach(i => $("#" + i).value = "");
    toast("PIN Owner diubah.");
}

async function resetSupPin() {
    const m = $("#km"), n = $("#k4").value, n2 = $("#k5").value;
    m.textContent = "";
    if (!pinValid(n)) { m.textContent = "PIN harus 4 sampai 8 angka."; return; }
    if (n !== n2) { m.textContent = "Pengulangan PIN tidak sama."; return; }
    if (await checkPin(n, await pinRecord("owner"))) { m.textContent = "PIN Supervisor tidak boleh sama dengan PIN Owner."; return; }
    await pinStore("sup", await makePin(n));
    ["k4", "k5"].forEach(i => $("#" + i).value = "");
    toast("PIN Supervisor diatur ulang.");
}

try {
    const x=localStorage.getItem(K);
    if(x) {
        S=JSON.parse(x);
        S.W=S.W||DW.map(w=>w.slice());
        S.cfg=S.cfg||{};
        S.log=S.log||[];
        lc();
        normState()
    } else demo()
} catch(e) {
    demo()
}

function save() {
    try { localStorage.setItem(K, JSON.stringify(S)) } catch (e) { toast("Data tidak dapat disimpan di browser ini."); }
}

function chart(m) {
    const w=640,h=250,L=38,T=14,B=26,pw=w-L-12,ph=h-T-B;
    let xm=Math.max(S.dur,m.n);
    if(m.rata>0&&m.pr<100)xm=Math.min(Math.max(xm,m.n+Math.ceil(m.sisa/m.rata)),S.dur+20);
    const lo=Math.max(0,Math.floor((S.awal-3)/5)*5),X=d=>L+d/xm*pw,Y=p=>T+(1-(p-lo)/(100-lo))*ph;
    let g="";
    for(let p=lo;p<=100;p+=5)g+=`<line x1="${L}" x2="${w-12}" y1="${Y(p)}" y2="${Y(p)}" stroke="var(--bd)"/><text x="${L-5}" y="${Y(p)+4}" font-size="10" text-anchor="end" fill="var(--mu)">${p}</text>`;
    for(let d=0;d<=xm;d+=Math.ceil(xm/10))g+=`<text x="${X(d)}" y="${h-8}" font-size="10" text-anchor="middle" fill="var(--mu)">${d}</text>`;
    const pts=[[0,S.awal],...m.cs.map((c,i)=>[i+1,i==m.n-1?m.pr:c.prog])].map(p=>X(p[0])+","+Y(p[1])).join(" ");
    let pj="";
    if(m.rata>0&&m.pr<100) {
        const e=Math.min(xm,m.n+m.sisa/m.rata);
        pj=`<line x1="${X(m.n)}" y1="${Y(m.pr)}" x2="${X(e)}" y2="${Y(Math.min(100,m.pr+m.rata*(e-m.n)))}" stroke="var(--bad)" stroke-width="2" stroke-dasharray="2 4"/>`
    }
    return`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Kurva S rencana dan aktual">${g}
<line x1="${X(S.dur)}" x2="${X(S.dur)}" y1="${T}" y2="${T+ph}" stroke="var(--wa)" stroke-dasharray="4 3"/><text x="${X(S.dur)-4}" y="${T+ph-6}" font-size="10" text-anchor="end" fill="var(--wa)">Deadline</text>
<polyline points="${Array.from({length:S.dur+1},(_,d)=>X(d)+","+Y(planAt(d))).join(" ")}" fill="none" stroke="var(--mu)" stroke-width="2" stroke-dasharray="6 4"/>
<polyline points="${pts}" fill="none" stroke="var(--ac)" stroke-width="3"/>${pj}</svg>
<div class="leg">Garis putus abu-abu: rencana. Garis oranye: aktual. Titik-titik merah: proyeksi. Sumbu X: hari kerja, sumbu Y: progres fisik (%).</div>`
}

function render() {
    const m=M();
    $("#jd").textContent=S.nama||"SiteOwner";
    const n=m.n,al=alerts(m),fl=flags(m),rk=rank(m);
    if(role=="owner")$("#t-d").innerHTML=`<div class="ban ${m.lv}">${m.tx}<small>Hari ke-${n} dari ${S.dur} hari kontrak. Deviasi terhadap rencana: ${m.dev>=0?"+":""}${F(m.dev)}%${m.lop?"<br>Opname lapangan hari ke-"+m.lop.d+": "+F(m.lop.v)+"% oleh "+esc(m.lop.by||"-")+" (hitungan sistem: "+F(m.prSys)+"%). Dashboard memakai hasil opname sebagai acuan.":""}</small></div>
<div class="grid"><div class="k"><b>${F(m.pr)}%</b><span>Progres aktual</span></div><div class="k"><b>${F(m.ren)}%</b><span>Progres rencana</span></div>
<div class="k"><b>${m.est===null?"–":m.est+" hari"}</b><span>Estimasi sisa waktu (sisa kontrak ${Math.max(0,m.sk)})</span></div>
<div class="k"><b>${n?m.last.fit+"/"+W.length:"–"}</b><span>Pekerja fit hari ini</span></div>
<div class="k"><b>${Rp(m.up)}</b><span>Upah kumulatif (anggaran ${Rp(m.bud)})</span></div><div class="k"><b>${m.ap}</b><span>Pelanggaran APD</span></div></div>
${tindakanHTML(m)}
${rabHTML(m)}
<div class="card"><h2>Kurva S Proyek</h2><div class="sc">${chart(m)}</div></div>
${n?`<div class="card"><h2>Rincian Upah Hari ke-${n}</h2><div class="tw"><table><tr><th>Pekerja</th><th>Status</th><th>Pokok</th><th>Lembur</th><th>Bonus</th><th>Potongan</th><th>Total</th><th>Dibanding upah normal</th><th>Catatan</th></tr>${m.last.o.map((o,i)=>{const d=o.up-STD;return`<tr><td>${esc(W[i][0])}</td><td>${o.ket||ST[o.st]}</td><td>${Rp(o.pk)}</td><td>${Rp(o.lm)}</td><td>${Rp(o.bn)}</td><td>${Rp(o.pt)}</td><td><b>${Rp(o.up)}</b></td><td style="color:var(--${d>0?"ok":d<0?"bad":"mu"})">${d>0?"Naik "+Rp(d):d<0?"Turun "+Rp(-d):"Normal"}</td><td>${esc((S.days[n-1][i]||{}).n||"")}</td></tr>`}).join("")}</table></div><div class="sub">Upah normal ${Rp(STD)} per hari. Total hari ini ${Rp(m.last.up)}.</div></div>`:""}
${kpiHTML(m)}
<div class="card"><h2>Peringatan &amp; Rekomendasi</h2>${al.map(a=>`<div class="al ${a[0]}">${esc(a[1])}</div>`).join("")}</div>
<div class="card"><h2>Indikasi Kejanggalan Data ${fl.length?"("+fl.length+")":""}</h2>${fl.length?fl.map(a=>`<div class="al ${a[0]}">${esc(a[1])}</div>`).join(""):`<div class="al ok">Tidak ada pola janggal terdeteksi. Pendeteksi penuh aktif setelah 3 hari data.</div>`}</div>
<div class="card"><h2>Ranking Kinerja Pekerja</h2><div class="tw"><table><tr><th>#</th><th>Nama</th><th>Zona</th><th>Rata-rata KPI</th><th>Hari kerja</th><th>Tidak layak</th></tr>
${rk.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.n)}</td><td>${esc(r.z)}</td><td>${r.c?F(r.k):"–"}</td><td>${r.c}</td><td>${r.v}</td></tr>`).join("")}</table></div></div>
${quickHTML()}
<div class="card"><h2>Jejak Audit Input</h2><div class="tw"><table><tr><th>Hari</th><th>Waktu input</th><th>Pengisi</th><th>Upah hari itu</th><th>Opname</th></tr>${m.cs.map((c,i)=>`<tr><td>${i+1}</td><td>${esc((S.meta[i]||{}).ts||"-")}</td><td>${esc((S.meta[i]||{}).by||"-")}</td><td>${Rp(c.up)}</td><td>${(o=>o?F(o.v)+"% oleh "+esc(o.by||"-"):"")(S.op.find(p=>p.d==i+1))}</td></tr>`).join("")}</table></div><div class="sub">Hari yang sudah disimpan terkunci. Tidak ada fitur ubah atau hapus data lama.</div></div>`;
    $("#hk").textContent="Hari ke-"+(n+1)+((n+1)-(S.op.slice(-1)[0]||{d:0}).d>=OPI?" – MENUNGGU OPNAME OWNER/QC":"");
    if(role=="owner")$("#rp").value=report(m,al.concat(fl));
    $("#sn").value=S.nama;
    $("#sd").value=S.dur;
    $("#sa").value=S.awal
}

const FIELDS = {
    h: r => true,
    s: r => r.h == 1,
    sd: r => r.h == 1 && r.s == 0,
    a: r => r.h == 1 && r.s != 0,
    ar: r => r.h == 1 && r.s != 0 && r.a == 0,
    v: r => r.h == 1 && r.s != 0 && r.a != 0,
    t: r => r.h == 1 && r.s != 0 && r.a != 0,
    d: r => r.h == 1 && r.s != 0 && r.a != 0,
    l: r => r.h == 1 && r.s != 0 && r.a != 0,
    nt: r => true
};
const pilih = k => OP[k].map((t, v) => `<option value="${v}">${t}</option>`).reverse().join("");
let dirty = false;

function rf() {
    return [...document.querySelectorAll("#ft .wk")].map(card => {
        const val = c => card.querySelector("." + c).value;
        const num = c => +val(c);
        const opt = c => val(c) === "" ? undefined : num(c);
        const n = val("nt").trim().slice(0, 80);
        if (num("h") == 0) return { h: 0, n };
        return { h: 1, s: num("s"), a: num("a"), v: Math.max(0, num("v") || 0), t: num("t"), d: num("d"),
                 l: num("l"), sd: opt("sd"), ar: opt("ar"), n };
    });
}

function prev() {
    const rows = rf(), res = calc(rows);
    document.querySelectorAll("#ft .wk").forEach((card, i) => {
        const r = rows[i], o = res.o[i], d = o.up - STD;
        card.querySelectorAll("[data-f]").forEach(l => l.hidden = !FIELDS[l.dataset.f](r));
        card.querySelector(".up").innerHTML = `<b>${Rp(o.up)}</b> <span style="color:var(--${d > 0 ? "ok" : d < 0 ? "bad" : "mu"})">${d > 0 ? "naik " + Rp(d) : d < 0 ? "turun " + Rp(-d) : "normal"}</span>`;
    });
}

function form() {
    dirty = false;
    const opsi = (v, t) => `<option value="${v}">${t}</option>`;
    $("#ft").innerHTML = W.map((w, i) => `
      <div class="wk" data-i="${i}">
        <div class="wh"><div><b>${esc(w[0])}</b> <span class="sub">${esc(w[1])}</span></div><div class="up"></div></div>
        <div class="g">
          <label data-f="h">Kehadiran<select class="h">${opsi(1, "Hadir")}${opsi(0, "Absen / izin")}</select></label>
          <label data-f="s">Kondisi kesehatan<select class="s">${pilih("s")}</select></label>
          <label data-f="sd">Surat dokter<select class="sd">${opsi("", "Pilih…")}${opsi(1, "Ada surat dokter")}${opsi(0, "Tanpa surat dokter")}</select></label>
          <label data-f="a">APD<select class="a">${pilih("a")}</select></label>
          <label data-f="ar">Alasan APD tidak lengkap<select class="ar">${opsi("", "Pilih…")}${opsi(1, "APD tidak disediakan / rusak")}${opsi(0, "Menolak memakai APD")}</select></label>
          <label data-f="v">Volume hasil (${esc(w[2])}), target ${esc(w[3])}<input class="v" type="number" inputmode="decimal" min="0" step="0.1" placeholder="isi angka"></label>
          <label data-f="t">Ketelitian<select class="t">${pilih("t")}</select></label>
          <label data-f="d">Kepatuhan K3<select class="d">${pilih("d")}</select></label>
          <label data-f="l">Durasi lembur<select class="l">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => opsi(v * 30, LB(v * 30))).join("")}</select></label>
          <label data-f="nt">Catatan / keberatan pekerja<input class="nt" maxlength="80" placeholder="opsional"></label>
        </div>
        <div class="er-msg" hidden></div>
      </div>`).join("");
    prev();
}

function check(rows) {
    const cards = document.querySelectorAll("#ft .wk");
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.h == 1 && r.s == 0 && r.sd === undefined) return { i, msg: "Pilih ada atau tidaknya surat dokter." };
        if (r.h == 1 && r.s != 0 && r.a == 0 && r.ar === undefined) return { i, msg: "Pilih alasan APD tidak lengkap." };
        if (r.h == 1 && r.s != 0 && r.a != 0 && cards[i].querySelector(".v").value === "") return { i, msg: "Isi volume hasil pekerja ini (angka, boleh 0)." };
    }
    return null;
}

function clearErr() {
    document.querySelectorAll("#ft .wk").forEach(c => { c.classList.remove("er"); c.querySelector(".er-msg").hidden = true; });
}

function showErr(er) {
    clearErr();
    const card = document.querySelectorAll("#ft .wk")[er.i];
    card.classList.add("er");
    const m = card.querySelector(".er-msg");
    m.textContent = er.msg;
    m.hidden = false;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    msg("Periksa " + W[er.i][0] + ": " + er.msg);
}

let CORR = 0; // nomor hari yang sedang dikoreksi (0 = input hari baru)

function fillForm(rows) {
    document.querySelectorAll("#ft .wk").forEach((card, i) => {
        const r = rows[i] || { h: 0 }, set = (c, v) => { if (v !== undefined) card.querySelector("." + c).value = v; };
        set("h", r.h);
        if (r.h == 1) { set("s", r.s); set("a", r.a); set("v", r.v); set("t", r.t); set("d", r.d); set("l", r.l); set("sd", r.sd); set("ar", r.ar); }
        set("nt", r.n || "");
    });
    prev();
}

function startCorr(n) {
    CORR = n;
    dirty = true;
    fillForm(S.days[n - 1]);
    $("#cb").hidden = false;
    $("#cb").textContent = "Mode koreksi hari ke-" + n + ": perbaiki isian, isi alasan koreksi, lalu kirim. Laporan asli tetap tersimpan sebagai riwayat.";
    $("#all").hidden = false;
    $("#tgl").hidden = true;
    $("#sv").textContent = "Kirim koreksi";
    window.scrollTo(0, 0);
}

function endCorr() {
    CORR = 0;
    $("#cb").hidden = true;
    $("#all").hidden = true;
    $("#tgl").hidden = false;
    $("#sv").textContent = "Hitung & Simpan Hari Ini";
}

function histUI() {
    const n = S.days.length, from = Math.max(1, n - 7);
    let h = "";
    for (let i = n; i >= from; i--) {
        const s = dayStatus(i), mt = S.meta[i - 1] || {};
        const btn = (s.s == "revisi" || s.s == "ditolak") ? `<button class="btn g" data-kr="${i}" style="padding:4px 10px">Koreksi</button>` : "";
        h += `<tr><td>${i}</td><td>${esc(mt.tgl || "-")}</td><td><span class="chip ${s.s}">${STATUS_TXT[s.s]}</span>${s.note ? `<div class="sub">Catatan owner: ${esc(s.note)}</div>` : ""}</td><td>${btn}</td></tr>`;
    }
    $("#hs").innerHTML = n ? `<div class="card"><h2>Riwayat pengiriman</h2><div class="tw"><table><tr><th>Hari</th><th>Tanggal</th><th>Status</th><th></th></tr>${h}</table></div><div class="sub">Laporan yang diminta revisi atau ditolak dapat dikoreksi. Koreksi disimpan sebagai versi baru; laporan asli tidak berubah.</div></div>` : "";
}
$("#hs").addEventListener("click", e => { const b = e.target.closest("[data-kr]"); if (b) startCorr(+b.dataset.kr); });

$("#sv").onclick = async () => {
    const btn = $("#sv");
    clearErr();
    const by = $("#by").value.trim();
    if (!by) { msg("Isi nama pengisi dulu agar tercatat di jejak audit."); $("#by").focus(); return; }
    const rows = rf(), er = check(rows) || rangeError(rows);
    if (er) { showErr(er); return; }
    let alasan = "", tgl = "";
    if (CORR) {
        alasan = $("#al").value.trim();
        if (alasan.length < 5) { msg("Isi alasan koreksi (minimal 5 huruf)."); $("#al").focus(); return; }
    } else {
        if (M().prSys >= 100) { msg("Proyek sudah 100%."); return; }
        tgl = $("#tg").value;
        const de = dateError(tgl, lastTgl());
        if (de) { msg(de); $("#tg").focus(); return; }
        if (needOpname()) { msg("Opname lapangan belum dilakukan (wajib tiap " + OPI + " hari kerja). Minta owner atau QC mengisi opname dulu."); return; }
    }
    const was = CORR, n = CORR || S.days.length + 1, total = calc(rows).up;
    btn.disabled = true;
    msg("Menyimpan…");
    try {
        if (was) await apiCommitCorr(was, rows, by, alasan);
        else await apiCommitDay(rows, by, tgl);
        $("#al").value = "";
        endCorr();
        form();
        render();
        histUI();
        msg((was ? "Koreksi hari ke-" + n + " terkirim" : "Hari ke-" + n + " tersimpan") + ". Total upah hari itu: " + Rp(total) + ".");
        window.scrollTo(0, 0);
    } catch (e) {
        msg("Gagal menyimpan: " + ((e && e.message) || e));
    } finally {
        btn.disabled = false;
    }
};

document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=> {
    document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("on",x==b));
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t.id=="t-"+b.dataset.t))
});
$("#cp").onclick=()=> {
    const t=$("#rp");
    t.select();
    let ok=false;
    try {
        ok=document.execCommand("copy")
    } catch(e) {
    }
    $("#cm").textContent=ok?"Tersalin. Tempel ke WhatsApp.":"Teks sudah terpilih, salin manual (Ctrl+C)."
};
[["#sn",v=>S.nama=v],["#sd",v=>S.dur=Math.max(1,+v||1)],["#sa",v=>S.awal=Math.min(99,Math.max(0,+v||0))]].forEach(([id,f])=>$(id).onchange=e=> {
    f(e.target.value);
    save();
    render()
});
$("#dm").onclick=()=> {
    demo();
    save();
    render();
    refresh()
};
$("#em").onclick=()=> {
    S.days=[]; S.raw=[]; S.meta=[]; S.op=[]; S.corr=[]; S.apprLog=[]; S.fin=[]; S.seals=[]; S.anggaran=0;
    normState();
    save();
    render();
    refresh()
};
const RNG = { std:[0,1e7], lem:[0,1e7], bon:[0,1e7], pen:[0,1e7], pap:[0,1e7], psd:[0,100], pst:[0,100], pas:[0,100], pam:[0,100], al:[0,100], ab:[0,100], lm1:[0,5], lm2:[0,5], opi:[1,30], vmax:[1.5,20] };
function clampCfg(k, v) {
    const [lo, hi] = RNG[k] || [0, 1e9], x = Math.min(hi, Math.max(lo, v));
    if (x !== v) toast("Nilai dibatasi ke rentang " + lo + " sampai " + hi + ".");
    return x;
}
const CF=[["std","Upah pokok per hari (Rp)",1],["lem","Upah lembur per jam (Rp)",1],["bon","Bonus insentif (Rp)",1],["pen","Penalti KPI rendah (Rp)",1],["pap","Potongan APD sebagian (Rp)",1],["psd","Upah sakit dengan surat dokter (%)",100],["pst","Upah sakit tanpa surat dokter (%)",100],["pas","Upah jika APD tidak disediakan/rusak (%)",100],["pam","Upah jika menolak memakai APD (%)",100],["al","Hasil minimal agar lembur dibayar (% target)",100],["ab","Hasil minimal agar dapat bonus (% target)",100],["lm1","Pengali lembur jam pertama (kali)",1],["lm2","Pengali lembur jam berikutnya (kali)",1],["opi","Jeda opname (hari kerja)",1],["vmax","Batas volume wajar (kali target)",1]];

function cfgui0() {
    const g=k=>({std:STD,lem:LEM,bon:BON,pen:PEN,pap:PAP,psd:PSD,pst:PST,pas:PAS,pam:PAM,al:AL,ab:AB,lm1:LM1,lm2:LM2,opi:OPI,vmax:VMAX})[k];
    $("#cf").innerHTML=`<h2 id="sec-pekerja">Pekerja &amp; target volume</h2><div class="tw"><table><tr><th>Nama</th><th>Zona kerja</th><th>Satuan</th><th>Target per hari</th></tr>${W.map((w,i)=>`<tr>${[0,1,2,3].map(k=>`<td><input data-w="${i},${k}" value="${esc(w[k])}" ${k==3?'type="number" min="0.1" step="0.1" style="width:90px"':'style="width:130px"'}></td>`).join("")}</tr>`).join("")}</table></div><div class="row" style="margin-top:8px"><button class="btn g" id="aw">+ Tambah pekerja</button></div><div class="sub" style="margin-bottom:12px">Pekerja tidak bisa dihapus agar riwayat tetap utuh. Sesuaikan target dengan AHSP atau RAB proyek.</div><h2 id="sec-upah">Aturan upah &amp; ambang</h2><div class="row">${CF.map(c=>`<label>${c[1]}<input data-c="${c[0]}" type="number" step="any" value="${Math.round(g(c[0])*c[2]*100)/100}" style="width:120px"></label>`).join("")}</div><div class="sub">Nilai awal adalah asumsi, bukan ketentuan hukum. Sakit dengan surat dokter pada umumnya tetap berhak upah (UU Ketenagakerjaan Pasal 93), dan APD wajib disediakan pengusaha tanpa biaya (Permenaker 8/2010). Pengali lembur bernilai awal 1 (tarif datar); aturan lembur resmi umumnya memakai pengali lebih besar (misalnya 1,5 untuk jam pertama dan 2 untuk jam berikutnya pada hari kerja), jadi periksa ketentuan yang berlaku. Sesuaikan dengan kontrak kerja dan peraturan perusahaan. Riwayat perubahan di perangkat ini:</div>${S.log.slice(-5).map(x=>`<div class="sub">- ${esc(logText(x))}</div>`).join("")||'<div class="sub">- belum ada</div>'}<br>`
}
$("#cf").addEventListener("change",e=> {
    const t=e.target;
    if(!t.dataset.w&&!t.dataset.c) return; // abaikan isian lain (PIN, rencana) agar tidak memuat ulang halaman
    const L=logAdd;
    if(t.dataset.w) {
        const[i,k]=t.dataset.w.split(",").map(Number),v=k==3?Math.max(.1,+t.value||1):(t.value.trim()||W[i][k]);
        L(W[i][0]+": "+["nama","zona","satuan","target"][k]+" diubah ke "+v);
        S.W[i][k]=v
    } else if(t.dataset.c) {
        const c=CF.find(x=>x[0]==t.dataset.c);
        S.cfg[c[0]]=clampCfg(c[0],+t.value||0)/c[2];
        L(c[1]+" diubah ke "+t.value)
    }
    save();
    lc();
    cfgui();
    form();
    render()
});
$("#cf").addEventListener("click",e=> {
    if(e.target.id=="aw"&&S.W.length<8) {
        S.W.push(["Pekerja "+(S.W.length+1),"Zona baru","m\u00b2",10]);
        logAdd("pekerja ditambahkan");
        save();
        lc();
        cfgui();
        form();
        render()
    }
});
let role = null;
const msg = t => { $("#sm").textContent = t };

const editing = sel => $(sel).contains(document.activeElement);

function cfgui() {
    cfgui0();
    $("#cf").insertAdjacentHTML("beforeend", rabEdHTML() + matmEdHTML() + taskEdHTML() + planHTML() + secHTML() + cadHTML());
}
$("#cf").addEventListener("click", async e => {
    if (e.target.id == "cpo") await changeOwnerPin();
    if (e.target.id == "cps") await resetSupPin();
    if (e.target.id == "spl") savePlan();
});

function enter(r) {
    role = r;
    $("#gate").style.display = "none";
    $("#app").style.display = "block";
    document.querySelectorAll(".tabs button").forEach(b => b.style.display = (b.dataset.r == r || b.dataset.r == "all") ? "" : "none");
    $("#who").textContent = "Masuk sebagai: " + RL[r] + " (data tersimpan di perangkat ini)";
    $("#lo").style.display = "";
    idleReset();
    helpui();
    form();
    $("#tg").value = todayStr();
    endCorr();
    histUI();
    matUI();
    jadUI();
    if (r == "sup") byaUI();
    if (r == "owner") { cfgui(); opui(); apprUI(); finUI(); anaUI(); logUI(); }
    render();
    $("#sm").textContent = "";
    document.querySelector(".tabs button[data-r='" + r + "']").click();
}

function refresh() {
    if (!role) return;
    render();
    if (role == "owner") {
        if (!editing("#cf")) cfgui();
        if (!editing("#t-o")) opui();
        if (!editing("#t-a")) apprUI();
        if (!editing("#t-k")) finUI();
        if (!editing("#t-n")) anaUI();
        logUI();
        matUI();
        jadUI();
    } else {
        histUI();
        if (!editing("#t-m")) matUI();
        if (!editing("#t-j")) jadUI();
        if (!editing("#t-y")) byaUI();
        if (!dirty) form();
    }
}

function helpui() {
    const H = [
        ["Apa itu opname?", "Opname adalah pengecekan langsung di lapangan oleh pihak independen (QC, pengawas, atau owner) untuk mengukur berapa persen pekerjaan yang benar-benar sudah terpasang, lalu dibandingkan dengan gambar kerja dan RAB. Contoh: setelah 5 hari, QC mengukur dan menyatakan progres 72%, sedangkan hitungan aplikasi 75%. Aplikasi memakai 72% sebagai acuan dan menandai selisihnya."],
        ["Progres sistem dan progres opname", "Progres sistem adalah perkiraan dari kehadiran, KPI, dan lembur. Progres opname adalah hasil ukur nyata. Setelah ada opname, progres dihitung dari angka opname ditambah kemajuan sesudahnya. Opname wajib diisi tiap beberapa hari kerja (nilai awal 5, bisa diatur owner); sebelum itu supervisor tidak bisa menyimpan hari berikutnya."],
        ["Bagaimana KPI dan upah dihitung?", "Kecepatan dinilai otomatis dari rasio volume hasil terhadap target (bukan skor subjektif). Ketelitian dan kepatuhan K3 dipilih dari kategori. KPI = (kecepatan + ketelitian + K3) dibagi 15, dikali 100. Bonus untuk KPI tinggi, penalti untuk KPI rendah, lembur hanya dibayar jika hasil mencapai ambang dan pekerja sehat. Semua angka bisa diatur owner di Pengaturan."],
        ["Surat dokter dan alasan APD", "Pekerja sakit dilarang bekerja. Supervisor memilih apakah ada surat dokter; besar upah mengikuti pengaturan owner (nilai awal: dengan surat dokter 100%, tanpa surat dokter 50%). APD tidak lengkap juga membuat pekerja dilarang bekerja. Jika APD tidak disediakan atau rusak, itu tanggung jawab proyek dan bukan pelanggaran pekerja; jika pekerja menolak memakai, upah mengikuti pengaturan. Nilai awal ini asumsi, bukan ketentuan hukum."],
        ["Kurva S dan deviasi", "Kurva S membandingkan progres rencana (garis lurus, kurva S standar, atau titik kustom sesuai time schedule, sampai 100% pada akhir kontrak) dengan progres aktual. Deviasi adalah selisihnya. Status: lebih cepat, sesuai jadwal, potensi terlambat, atau kritis."],
        ["Penyimpanan data", "Data tersimpan di browser perangkat ini (localStorage), tanpa server dan tanpa internet. Karena itu data tidak otomatis muncul di perangkat lain dan akan hilang jika data situs browser dihapus. Buat cadangan berkala di Pengaturan, bagian Cadangan data, lalu simpan berkasnya di tempat aman. Peran Owner dan Supervisor memakai PIN yang hanya melindungi tampilan; ini bukan keamanan sejati."],
        ["RAB, biaya, dan keuntungan", "RAB (rencana anggaran biaya) diisi owner di Pengaturan: nilai kontrak dan daftar item per kategori (material, upah, peralatan, subkontraktor, pajak, perizinan dan biaya dinas, pengawas, konsultan, overhead, lain-lain). Item dihitung dari volume x harga, atau sebagai persen dari nilai kontrak (cocok untuk pajak). Realisasi diambil otomatis: upah dari laporan harian, material dari material masuk, dan biaya lain dari catatan yang diisi supervisor atau owner. Estimasi keuntungan saat ini = nilai kontrak x kemajuan pekerjaan - biaya terpakai. Proyeksi biaya akhir = biaya terpakai / kemajuan pekerjaan. Biaya terpakai menghitung material yang sudah dipakai (keluar), bukan yang baru dibeli. Semua angka bergantung pada data yang dimasukkan, jadi perlu diperiksa."],
        ["Material", "Owner menyiapkan daftar material (satuan, batas minimum, kebutuhan RAB, harga standar) di Pengaturan. Supervisor mencatat material masuk dan keluar. Stok = masuk - keluar. Aplikasi memperingatkan stok menipis, stok negatif, pemakaian melebihi kebutuhan RAB, dan material masuk yang jauh melebihi kebutuhan. Pembelian bahan dicatat di modul Material (bukan di Biaya) agar stok dan biaya sinkron."],
        ["Jadwal pekerjaan", "Owner mengisi pekerjaan beserta tanggal mulai dan target selesai di Pengaturan. Supervisor memperbarui persen selesai. Rencana hari ini dihitung linear antara tanggal mulai dan target; selisih dengan realisasi menentukan status: sesuai jadwal, terlambat ringan, terlambat, lewat target, atau selesai."],
        ["Laporan, ekspor, dan data anonim", "Tab Analisis membuat laporan harian, mingguan, bulanan, dan rekap akhir. PDF, CSV (Excel), dan teks laporan diunduh sebagai berkas. Opsi Anonimkan mengganti nama pekerja dan pengisi dengan kode saat mengekspor untuk keperluan penelitian."],
        ["Persetujuan dan koreksi laporan", "Setiap laporan harian yang dikirim supervisor berstatus Dikirim. Owner dapat menyetujui, meminta revisi, atau menolak (dengan catatan) di tab Persetujuan. Laporan yang diminta revisi atau ditolak dapat dikoreksi supervisor lewat tombol Koreksi di Riwayat pengiriman; koreksi wajib beralasan dan disimpan sebagai versi baru, sedangkan laporan asli tidak pernah dihapus atau diubah. Setelah dikoreksi, laporan kembali berstatus Dikirim ulang untuk diputuskan lagi. Upah yang dihitung final adalah upah pada laporan yang disetujui."],
        ["Keuangan", "Tab Keuangan memuat anggaran periode (untuk sisa pekerjaan dari progres awal sampai 100%), upah otomatis dari laporan harian (dipisah disetujui dan menunggu), serta pengeluaran lain (material, operasional, subkontraktor, lainnya) yang dicatat owner. Pengeluaran tidak dihapus; koreksi dilakukan dengan entri bernilai negatif beserta keterangan. Aplikasi membandingkan persentase biaya terpakai dengan kemajuan pekerjaan sebagai peringatan dini."],
        ["Analisis dan ekspor data", "Tab Analisis menampilkan tren progres, upah, KPI, dan kehadiran untuk rentang hari yang dipilih, serta ringkasan periode. Data dapat diekspor sebagai CSV (rekap harian, per pekerja, opname, dan biaya) untuk dibuka di Excel atau Google Sheets. Kamus data di halaman yang sama menjelaskan arti tiap kolom."],
        ["Opname rinci", "Selain progres keseluruhan, opname dapat memuat daftar item pekerjaan: nama, lokasi, satuan, volume rencana, volume terpasang, dan bobot. Jika total bobot 100%, aplikasi menghitung progres tertimbang secara otomatis. Tanggal dan pemeriksa tercatat."],
        ["Login dan PIN", "Setiap peran punya PIN sendiri (4 sampai 8 angka, disimpan sebagai hash berulang dengan garam, bukan teks asli). PIN Owner dan PIN Supervisor harus berbeda, sehingga supervisor tidak dapat masuk sebagai Owner. Setelah 5 kali salah, login dikunci 30 detik. Sesi berakhir otomatis setelah 10 menit tidak aktif. Karena data ada di perangkat ini, PIN hanya melindungi tampilan aplikasi."],
        ["Siapa bisa melihat apa?", "Owner melihat dashboard, kejanggalan, biaya, opname, laporan, dan pengaturan. Supervisor hanya mengisi audit harian. Tampilan supervisor tidak memuat dashboard owner. Pembatasan ini ada di tampilan; siapa pun yang menguasai perangkat ini secara teknis dapat membaca data."]
    ];
    $("#t-b").innerHTML = `<div class="card"><h2>Bantuan</h2>${H.map(h => `<details style="margin-bottom:8px"><summary><b>${h[0]}</b></summary><p style="margin:6px 0 4px;font-size:14px">${h[1]}</p></details>`).join("")}</div>`;
}

function itemRow(it) {
    it = it || {};
    const num = v => v === undefined || v === null ? "" : v;
    return `<tr class="ir"><td><input class="i-nm" value="${esc(it.nm || "")}" placeholder="Pekerjaan" style="width:120px"></td><td><input class="i-lok" value="${esc(it.lok || "")}" placeholder="Lokasi" style="width:84px"></td><td><input class="i-sat" value="${esc(it.sat || "")}" placeholder="m²" style="width:48px"></td><td><input class="i-vr" type="number" step="any" min="0" value="${num(it.vr)}" style="width:72px"></td><td><input class="i-vt" type="number" step="any" min="0" value="${num(it.vt)}" style="width:72px"></td><td><input class="i-bw" type="number" step="any" min="0" value="${num(it.bobot)}" style="width:56px"></td><td><button class="btn g" data-rm="1" style="padding:3px 9px">×</button></td></tr>`;
}

function readItems() {
    return [...document.querySelectorAll("#oi .ir")].map(r => ({
        nm: r.querySelector(".i-nm").value.trim(), lok: r.querySelector(".i-lok").value.trim(), sat: r.querySelector(".i-sat").value.trim(),
        vr: +r.querySelector(".i-vr").value, vt: +r.querySelector(".i-vt").value, bobot: +r.querySelector(".i-bw").value
    }));
}

function opui() {
    const lo = S.op.slice(-1)[0] || { d: 0 }, due = needOpname();
    const hist = S.op.map(o => `<tr><td>${o.d}</td><td>${esc(o.tgl || "-")}</td><td>${F(o.v)}%</td><td>${esc(o.by || "-")}</td><td>${(o.items || []).length ? `<details><summary>${o.items.length} item</summary>${o.items.map(it => esc(it.nm) + " (" + esc(it.lok || "-") + "): " + it.vt + "/" + it.vr + " " + esc(it.sat || "") + ", bobot " + it.bobot + "%").join("<br>")}</details>` : "-"}</td></tr>`).join("");
    $("#t-o").innerHTML = `<div class="card"><h2>Opname Lapangan (QC / Owner)</h2>
      <details style="margin-bottom:8px"><summary><b>Apa itu opname?</b></summary><p class="sub" style="font-size:14px;color:var(--tx)">Pengecekan langsung progres fisik di lapangan oleh pihak independen. Hasilnya menjadi acuan progres.</p></details>
      <div class="al ${due ? "bad" : "ok"}">${due ? "Opname sudah jatuh tempo. Supervisor tidak bisa menyimpan hari berikutnya sebelum opname diisi." : "Opname terakhir setelah hari ke-" + lo.d + ". Berikutnya wajib sebelum hari ke-" + (lo.d + OPI) + "."}</div>
      <div class="row"><label>Tanggal opname<input id="otg" type="date" value="${todayStr()}"></label><label>Progres fisik hasil cek langsung (%)<input id="ov" type="number" min="0" max="100" step="0.1" style="width:150px"></label><label>Diperiksa oleh<input id="op" style="width:170px"></label></div>
      <details open style="margin:8px 0"><summary><b>Rincian per item pekerjaan</b> (opsional, disarankan)</summary>
        <div class="tw"><table><tr><th>Pekerjaan</th><th>Lokasi</th><th>Sat.</th><th>Vol. rencana</th><th>Vol. terpasang</th><th>Bobot %</th><th></th></tr><tbody id="oi">${itemRow()}</tbody></table></div>
        <div class="row" style="margin-top:6px"><button class="btn g" id="oia">+ Tambah item</button><button class="btn g" id="oic">Hitung progres dari item</button></div>
        <div class="sub">Total bobot harus 100%. Progres item dihitung terpasang ÷ rencana (maksimal 100%), lalu ditimbang dengan bobot.</div></details>
      <div class="row"><button class="btn" id="so">Simpan Opname</button></div>
      <div class="sub" id="om"></div>
      <h2 style="margin-top:12px">Riwayat Opname</h2>${S.op.length ? `<div class="tw"><table><tr><th>Setelah hari</th><th>Tanggal</th><th>Progres</th><th>Pemeriksa</th><th>Item</th></tr>${hist}</table></div>` : '<div class="sub">Belum ada opname.</div>'}</div>`;
    $("#so").onclick = async () => {
        const v = $("#ov").value, b = $("#op").value.trim(), tgl = $("#otg").value, m = $("#om");
        if (v === "" || !b) { m.textContent = "Isi progres dan nama pemeriksa."; return; }
        const de = dateError(tgl, null);
        if (de) { m.textContent = de.replace("kerja", "opname"); return; }
        let val = Math.min(100, Math.max(0, +v));
        const items = readItems().filter(i => i.nm || i.vr || i.vt || i.bobot);
        if (items.length) {
            const r = opnameFromItems(items);
            if (!r.ok) { m.textContent = r.err; return; }
            if (Math.abs(r.pct - val) > 0.5) { m.textContent = "Progres yang diisi tidak cocok dengan item (hitungan item: " + F(r.pct, 2) + "%). Klik Hitung progres dari item, atau kosongkan item."; return; }
        }
        try {
            await apiCommitOp(val, b, items, tgl);
            render();
            opui();
        } catch (e) { m.textContent = "Gagal menyimpan opname: " + ((e && e.message) || e); }
    };
}

$("#t-o").addEventListener("click", e => {
    if (e.target.id == "oia") $("#oi").insertAdjacentHTML("beforeend", itemRow());
    if (e.target.closest("[data-rm]")) { const r = e.target.closest(".ir"); if (document.querySelectorAll("#oi .ir").length > 1) r.remove(); }
    if (e.target.id == "oic") {
        const r = opnameFromItems(readItems());
        if (!r.ok) { $("#om").textContent = r.err; return; }
        $("#ov").value = r.pct;
        $("#om").textContent = "Progres tertimbang dari item: " + F(r.pct, 2) + "%.";
    }
});

function planHTML() {
    const pl = (S.plan || []).map(p => p[0] + "=" + p[1]).join(", "), sel = v => S.shape == v ? " selected" : "";
    const hist = (S.planHist || []).slice(-5).map((x, k) => `<div class="sub">- ${esc(new Date(x.ts).toLocaleDateString("id-ID"))}: ${esc(x.shape)}${x.plan.length ? " (" + esc(x.plan.map(p => p[0] + "=" + p[1]).join(", ")) + ")" : ""}, alasan: ${esc(x.alasan)}</div>`).join("");
    return `<div class="card" id="sec-plan"><h2>Rencana progres (Kurva S)</h2>
      <div class="row"><label>Bentuk rencana<select id="shp" style="max-width:240px"><option value="linear"${sel("linear")}>Garis lurus</option><option value="s"${sel("s")}>Kurva S standar</option><option value="custom"${sel("custom")}>Kustom (titik hari=persen)</option></select></label>
      <label>Titik kustom (hari=persen)<input id="plp" style="width:260px" placeholder="5=70, 10=82, 15=93" value="${esc(pl)}"></label>
      <label>Alasan perubahan<input id="pla" style="width:260px" placeholder="wajib jika sudah ada laporan"></label><button class="btn g" id="spl">Simpan rencana</button></div>
      <div class="sub">Kurva S standar landai di awal dan akhir, curam di tengah. Untuk rencana sesuai time schedule proyek, pilih Kustom dan isi titik progres kumulatif rencana. Setiap perubahan disimpan sebagai versi baru beserta alasannya agar perbandingan tetap dapat ditelusuri.</div>${hist ? '<div class="sub" style="margin-top:6px"><b>Riwayat versi rencana</b></div>' + hist : ""}<div class="er-msg" id="plm"></div></div>`;
}

function savePlan() {
    const shape = $("#shp").value, alasan = $("#pla").value.trim();
    let plan = [];
    if (shape == "custom") {
        const r = parsePlan($("#plp").value, S.dur);
        if (!r.ok) { $("#plm").textContent = r.err; return; }
        if (!r.plan.length) { $("#plm").textContent = "Isi minimal satu titik untuk rencana kustom."; return; }
        plan = r.plan;
    }
    if (S.days.length && alasan.length < 5) { $("#plm").textContent = "Isi alasan perubahan rencana (minimal 5 huruf) karena sudah ada laporan harian."; return; }
    S.shape = shape; S.plan = plan;
    S.planHist = S.planHist || [];
    S.planHist.push({ ts: new Date().toISOString(), shape, plan, alasan: alasan || "versi awal" });
    logAdd("rencana progres diubah ke " + shape + (alasan ? ": " + alasan : ""));
    save(); lc(); render(); cfgui();
}


const chip = s => `<span class="chip ${s}">${STATUS_TXT[s]}</span>`;
const cardH = (t, b) => `<div class="card"><h2>${t}</h2>${b}</div>`;
const TABN = { a: "Persetujuan", o: "Opname", k: "Keuangan", m: "Material", j: "Jadwal" };

function apprUI() {
    const n = S.days.length;
    if (!n) { $("#t-a").innerHTML = cardH("Persetujuan Laporan Harian", '<div class="sub">Belum ada laporan.</div>'); return; }
    let cards = "";
    for (let i = n; i >= 1; i--) {
        const s = dayStatus(i), c = calc(S.days[i - 1]), mt = S.meta[i - 1] || {}, cr = (S.corr || []).filter(x => x.n == i);
        cards += `<div class="wk" data-day="${i}"><div class="wh"><div><b>Hari ke-${i}</b> <span class="sub">${esc(mt.tgl || "")} · ${esc(mt.by || "")}</span></div>${chip(s.s)}</div>
          <div class="sub">Bekerja ${c.fit}/${S.days[i - 1].length} · Upah ${Rp(c.up)} · Lembur dibayar ${F(c.lem)} jam${c.ap + c.ps ? " · APD bermasalah " + (c.ap + c.ps) : ""}${c.sk ? " · Sakit " + c.sk : ""}</div>
          ${cr.length ? `<div class="sub">Koreksi: ${cr.map(x => "v" + x.k + " oleh " + esc(x.by || "-") + " (" + esc(x.alasan) + ")").join("; ")}</div>` : ""}
          ${s.note ? `<div class="sub">Catatan owner: ${esc(s.note)}</div>` : ""}
          <div class="row" style="margin-top:6px"><label style="flex:1;min-width:180px">Catatan<input class="an" maxlength="120" placeholder="wajib untuk revisi atau tolak" style="width:100%"></label><button class="btn" data-ap="disetujui">Setujui</button><button class="btn g" data-ap="revisi">Minta revisi</button><button class="btn g" data-ap="ditolak">Tolak</button></div><div class="er-msg" hidden></div></div>`;
    }
    $("#t-a").innerHTML = cardH("Persetujuan Laporan Harian", '<div class="sub">Laporan baru berstatus Dikirim. Setujui, minta revisi, atau tolak dengan catatan. Supervisor hanya dapat mengoreksi laporan yang diminta revisi atau ditolak, dan koreksi dicatat sebagai versi baru tanpa menghapus data asli. Upah final hanya menghitung hari yang disetujui.</div>') + cards;
}
$("#t-a").addEventListener("click", async e => {
    const b = e.target.closest("[data-ap]");
    if (!b) return;
    const card = b.closest("[data-day]"), n = +card.dataset.day, st = b.dataset.ap;
    const note = card.querySelector(".an").value.trim(), er = card.querySelector(".er-msg");
    if (st != "disetujui" && note.length < 3) { er.textContent = "Isi catatan (minimal 3 huruf) untuk meminta revisi atau menolak."; er.hidden = false; return; }
    b.disabled = true;
    try { await apiCommitAppr(n, st, note); apprUI(); render(); }
    catch (x) { er.textContent = "Gagal menyimpan: " + ((x && x.message) || x); er.hidden = false; b.disabled = false; }
});

const kp = (v, t) => `<div class="k"><b>${v}</b><span>${t}</span></div>`;
const rpR = v => `<td style="text-align:right">${v}</td>`;

function katTable(f) {
    return KATB.filter(k => f.rab.by[k] || f.real[k]).map(k => { const d = f.rab.by[k] - f.real[k]; return `<tr><td>${esc(k)}</td>${rpR(Rp(f.rab.by[k]))}${rpR(Rp(f.real[k]))}<td style="text-align:right;color:var(--${d < 0 ? "bad" : "ok"})">${Rp(d)}</td></tr>`; }).join("");
}

function rabHTML(m) {
    const f = finSummary(m);
    if (!f.rab.total && !f.nilai && !f.total) return "";
    const un = f.nilai ? `<div class="al ${f.untungProyeksi < 0 ? "bad" : f.untungProyeksi < f.untungRencana * 0.5 ? "wa" : "ok"}">Rencana keuntungan (kontrak - RAB): ${Rp(f.untungRencana)}. Estimasi keuntungan saat ini: ${Rp(f.untungSaatIni)}. Proyeksi keuntungan akhir: ${f.eac ? Rp(f.untungProyeksi) : "belum dapat dihitung"}.</div>` : '<div class="al wa">Isi nilai kontrak di Pengaturan, bagian RAB dan biaya, untuk melihat estimasi keuntungan.</div>';
    return `<div class="card"><h2>RAB dan biaya proyek</h2><div class="grid">${kp(f.nilai ? Rp(f.nilai) : "–", "Nilai kontrak")}${kp(Rp(f.rab.total), "RAB (rencana biaya)")}${kp(Rp(f.total), "Realisasi biaya")}${kp(f.ang ? Rp(f.sisa) : "–", "Sisa RAB")}${kp(f.eac ? Rp(f.eac) : "–", "Proyeksi biaya akhir")}${kp(f.nilai && f.eac ? Rp(f.untungProyeksi) : "–", "Proyeksi keuntungan akhir")}</div>${un}<div class="tw"><table><tr><th>Kategori</th><th>RAB</th><th>Realisasi</th><th>Selisih</th></tr>${katTable(f)}</table></div><div class="sub">Realisasi biaya: upah dari laporan harian, material dari pembelian (material masuk), biaya lain dari catatan biaya. Estimasi dan proyeksi memakai nilai material yang sudah dipakai (bukan yang baru dibeli) dan kemajuan pekerjaan periode ini (${F(f.kemajuan, 0)}%). <a href="#" data-go="k">Buka Keuangan</a></div></div>`;
}

let EDITFIN = 0, DELARM = 0, DELT = 0, WHO = "";
$("#by").addEventListener("input", e => { WHO = e.target.value; });
const nameField = id => `<label>Nama pencatat<input id="${id}" value="${esc(WHO)}" maxlength="40" style="width:150px"></label>`;

function finFormHTML(owner) {
    const e = EDITFIN ? S.fin.find(x => x.id == EDITFIN) : null;
    return `<div class="row"><label>Tanggal<input id="ft1" type="date" value="${e ? esc(e.tgl) : todayStr()}"></label><label>Kategori<select id="ft2" style="max-width:220px">${KAT.map(k => `<option${e && e.kat == k ? " selected" : ""}>${k}</option>`).join("")}</select></label><label>Keterangan<input id="ft3" maxlength="80" style="width:200px" value="${e ? esc(e.ket) : ""}"></label><label>Jumlah (Rp)<input id="ft4" type="number" step="any" style="width:140px" value="${e ? e.jml : ""}"></label>${owner ? "" : nameField("ft5")}<button class="btn" id="fadd">${e ? "Simpan perubahan" : "Tambah"}</button>${e ? '<button class="btn g" id="fcan">Batal</button>' : ""}</div>`;
}

function finUI() {
    const m = M(), f = finSummary(m), uv = S.fin.filter(x => !x.verif).length;
    const note = !f.ang ? '<div class="al wa">RAB belum diisi. Isi di Pengaturan, bagian RAB dan biaya.</div>' : f.pakai >= 100 ? '<div class="al bad">RAB sudah terlampaui.</div>'
        : f.selisih > 10 ? `<div class="al wa">Biaya terpakai (${F(f.pakai, 0)}%) jauh lebih cepat daripada kemajuan pekerjaan (${F(f.kemajuan, 0)}%).</div>`
        : `<div class="al ok">Biaya terpakai ${F(f.pakai, 0)}% sejalan dengan kemajuan pekerjaan ${F(f.kemajuan, 0)}%.</div>`;
    const list = S.fin.slice().reverse().slice(0, 30).map(x => `<tr><td>${esc(x.tgl)}</td><td>${esc(x.kat)}</td><td>${esc(x.ket)}</td>${rpR(Rp(x.jml))}<td>${esc(x.by || "-")}</td><td>${x.verif ? '<span class="chip disetujui">Terverifikasi</span>' : '<span class="chip revisi">Menunggu</span>'}</td><td style="white-space:nowrap"><button class="btn g" data-fe="${x.id}" style="padding:3px 8px">Ubah</button> ${x.verif ? "" : `<button class="btn g" data-fv="${x.id}" style="padding:3px 8px">Verifikasi</button> `}<button class="btn g" data-fd="${x.id}" style="padding:3px 8px">Hapus</button></td></tr>`).join("");
    $("#t-k").innerHTML = cardH("Keuangan Proyek", `<div class="grid">${kp(f.nilai ? Rp(f.nilai) : "–", "Nilai kontrak")}${kp(Rp(f.rab.total), "RAB")}${kp(Rp(f.total), "Realisasi biaya")}${kp(f.ang ? Rp(f.sisa) : "–", "Sisa RAB")}${kp(f.nilai ? Rp(f.untungSaatIni) : "–", "Keuntungan saat ini")}${kp(f.eac && f.nilai ? Rp(f.untungProyeksi) : "–", "Proyeksi keuntungan akhir")}</div>${note}<div class="sub">Nilai kontrak, RAB, dan harga diedit di Pengaturan. <a href="#" data-go="p:#sec-rab">Buka RAB dan biaya</a></div>`)
      + cardH("RAB dibanding realisasi", `<div class="tw"><table><tr><th>Kategori</th><th>RAB</th><th>Realisasi</th><th>Selisih</th></tr>${katTable(f)}<tr><td><b>Total</b></td>${rpR("<b>" + Rp(f.rab.total) + "</b>")}${rpR("<b>" + Rp(f.total) + "</b>")}${rpR("<b>" + Rp(f.rab.total - f.total) + "</b>")}</tr></table></div><div class="sub">Upah: disetujui ${Rp(f.upahOk)}, menunggu persetujuan ${Rp(f.upahPending)}. Material dihitung dari material masuk.</div>`)
      + cardH("Catat dan kelola biaya" + (uv ? " (" + uv + " menunggu verifikasi)" : ""), `${finFormHTML(true)}<div class="sub">Supervisor juga dapat mencatat biaya; catatannya menunggu verifikasi owner. Perubahan dan penghapusan disimpan sebagai versi baru (riwayat tetap ada). Untuk koreksi bisa memakai entri bernilai negatif.</div><div class="er-msg" id="fm2"></div>${list ? `<div class="tw" style="margin-top:8px"><table><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th style="text-align:right">Jumlah</th><th>Oleh</th><th>Status</th><th></th></tr>${list}</table></div>` : ""}`);
}

function byaUI() {
    const list = S.fin.filter(x => x.role == "sup").slice().reverse().slice(0, 20).map(x => `<tr><td>${esc(x.tgl)}</td><td>${esc(x.kat)}</td><td>${esc(x.ket)}</td>${rpR(Rp(x.jml))}<td>${esc(x.by || "-")}</td><td>${x.verif ? '<span class="chip disetujui">Terverifikasi</span>' : '<span class="chip revisi">Menunggu owner</span>'}</td></tr>`).join("");
    $("#t-y").innerHTML = cardH("Catat Biaya Lapangan", `${finFormHTML(false)}<div class="sub">Catat pengeluaran lapangan di luar upah dan material (upah dihitung otomatis dari laporan harian; pembelian bahan dicatat di tab Material). Owner akan memverifikasi catatanmu.</div><div class="er-msg" id="fm2"></div>`)
      + (list ? cardH("Catatan biaya dari supervisor", `<div class="tw"><table><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th style="text-align:right">Jumlah</th><th>Oleh</th><th>Status</th></tr>${list}</table></div>`) : "");
}

async function finClick(e) {
    const t = e.target, ow = role == "owner", er = $("#fm2");
    const g = t.closest("[data-go]");
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const redraw = () => { if (ow) { finUI(); render(); } else byaUI(); };
    try {
        if (t.id == "fcan") { EDITFIN = 0; redraw(); return; }
        if (t.id == "fadd") {
            const tgl = $("#ft1").value, kat = $("#ft2").value, ket = $("#ft3").value.trim(), jml = +$("#ft4").value, by = ow ? "Owner" : $("#ft5").value.trim();
            const de = dateError(tgl, null);
            if (de) { er.textContent = de.replace("kerja", "pengeluaran"); return; }
            if (ket.length < 3) { er.textContent = "Isi keterangan (minimal 3 huruf)."; return; }
            if (!jml || Math.abs(jml) > 1e12 || (!ow && jml < 0)) { er.textContent = ow ? "Isi jumlah yang valid (boleh negatif untuk koreksi)." : "Isi jumlah lebih dari 0."; return; }
            if (!by) { er.textContent = "Isi nama pencatat."; return; }
            if (!ow) WHO = by;
            if (EDITFIN) { await apiEditFin(EDITFIN, { tgl, kat, ket, jml, verif: true }); EDITFIN = 0; }
            else await apiAddFin({ tgl, kat, ket, jml, by, role: ow ? "owner" : "sup", verif: ow });
            redraw();
        }
        if (ow && t.dataset.fe) { EDITFIN = +t.dataset.fe; finUI(); }
        if (ow && t.dataset.fv) { await apiEditFin(+t.dataset.fv, { verif: true }); redraw(); }
        if (ow && t.dataset.fd) {
            const id = +t.dataset.fd;
            if (DELARM == id && Date.now() - DELT < 6000) { await apiEditFin(id, { batal: true }); DELARM = 0; redraw(); }
            else { DELARM = id; DELT = Date.now(); er.textContent = "Tekan Hapus sekali lagi dalam 6 detik untuk membatalkan catatan ini (riwayat tetap tersimpan)."; }
        }
    } catch (x) { er.textContent = "Gagal menyimpan: " + ((x && x.message) || x); }
}
$("#t-k").addEventListener("click", finClick);
$("#t-y").addEventListener("click", finClick);

const mchip = s => `<span class="chip ${s == "aman" ? "disetujui" : s == "menipis" ? "revisi" : "ditolak"}">${s}</span>`;

function matUI() {
    const st = matStock(), al = matAlerts(), ow = role == "owner";
    const rows = st.map(o => `<tr><td>${esc(o.nm)}</td><td>${esc(o.sat)}</td><td>${o.masuk}</td><td>${o.keluar}</td><td><b>${o.stok}</b></td><td>${o.min || 0}</td><td>${o.keb || "-"}</td><td>${mchip(o.status)}</td></tr>`).join("");
    const opts = (S.matm || []).map(o => `<option value="${esc(o.id)}">${esc(o.nm)} (${esc(o.sat)})</option>`).join("");
    const mv = (S.mat || []).slice().reverse().slice(0, 20).map(x => { const y = (S.matm || []).find(z => z.id == x.mid) || { nm: "?", sat: "" }; return `<tr><td>${esc(x.tgl)}</td><td>${esc(y.nm)}</td><td>${x.jenis == "masuk" ? "Masuk" : "Keluar"}</td><td>${x.qty} ${esc(y.sat)}</td><td>${ow && x.harga > 0 ? Rp(x.harga) : ""}</td><td>${esc(x.ket)}</td><td>${esc(x.by || "")}</td></tr>`; }).join("");
    $("#t-m").innerHTML = cardH("Stok Material", st.length ? `<div class="tw"><table><tr><th>Material</th><th>Sat.</th><th>Masuk</th><th>Keluar</th><th>Stok</th><th>Min.</th><th>Kebutuhan RAB</th><th>Status</th></tr>${rows}</table></div>` : '<div class="al wa">Daftar material belum disiapkan. Owner mengisinya di Pengaturan, bagian Daftar material.</div>')
      + (al.length ? cardH("Peringatan material", al.map(a => `<div class="al ${a[0]}">${esc(a[1])}</div>`).join("")) : "")
      + (st.length ? cardH("Catat material masuk atau keluar", `<div class="row"><label>Tanggal<input id="mv1" type="date" value="${todayStr()}"></label><label>Material<select id="mv2" style="max-width:200px">${opts}</select></label><label>Jenis<select id="mv3"><option value="masuk">Masuk</option><option value="keluar">Keluar (dipakai)</option></select></label><label>Jumlah<input id="mv4" type="number" step="any" min="0" style="width:90px"></label><label>Harga satuan (Rp, opsional)<input id="mv5" type="number" step="any" min="0" style="width:120px"></label><label>Keterangan (supplier, nota, atau pekerjaan)<input id="mv6" maxlength="80" style="width:230px"></label>${ow ? "" : nameField("mv7")}<button class="btn" id="mvadd">Simpan</button></div><div class="sub">Material keluar tidak boleh melebihi stok. Catat pembelian bahan di sini (bukan di Biaya) agar stok dan biaya sinkron.</div><div class="er-msg" id="mvm"></div>`) : "")
      + (mv ? cardH("Riwayat keluar masuk", `<div class="tw"><table><tr><th>Tanggal</th><th>Material</th><th>Jenis</th><th>Jumlah</th><th>${ow ? "Harga" : ""}</th><th>Keterangan</th><th>Oleh</th></tr>${mv}</table></div>`) : "");
}
$("#t-m").addEventListener("click", async e => {
    if (e.target.id != "mvadd") return;
    const m = $("#mvm"), ow = role == "owner", tgl = $("#mv1").value, mid = $("#mv2").value, jenis = $("#mv3").value, qty = +$("#mv4").value, harga = +$("#mv5").value || 0, ket = $("#mv6").value.trim(), by = ow ? "Owner" : $("#mv7").value.trim();
    const de = dateError(tgl, null);
    if (de) { m.textContent = de.replace("kerja", "pencatatan"); return; }
    if (!(qty > 0) || qty > 1e9) { m.textContent = "Isi jumlah lebih dari 0."; return; }
    if (ket.length < 3) { m.textContent = "Isi keterangan (minimal 3 huruf)."; return; }
    if (!by) { m.textContent = "Isi nama pencatat."; return; }
    const st = matStock().find(o => o.id == mid);
    if (jenis == "keluar" && st && qty > st.stok) { m.textContent = "Stok " + st.nm + " hanya " + st.stok + " " + st.sat + ". Catat material masuk dulu atau periksa jumlahnya."; return; }
    if (!ow) WHO = by;
    try { await apiAddMat({ tgl, mid, jenis, qty, harga: jenis == "masuk" ? harga : 0, ket, by }); matUI(); if (ow) render(); }
    catch (x) { m.textContent = "Gagal menyimpan: " + ((x && x.message) || x); }
});

function ganttSVG() {
    const ts = S.tasks || [];
    if (!ts.length) return "";
    const d0 = Math.min(...ts.map(t => dayNum(t.mulai))), d1 = Math.max(...ts.map(t => dayNum(t.selesai))), span = Math.max(1, d1 - d0), tn = dayNum(todayStr());
    const L = 150, w = 640, rh = 26, h = ts.length * rh + 30, pw = w - L - 10, X = d => L + (d - d0) / span * pw;
    const bars = ts.map((t, i) => {
        const a = dayNum(t.mulai), b = dayNum(t.selesai), p = taskStatus(t).aktual, y = i * rh + 6;
        return `<text x="${L - 6}" y="${y + 12}" font-size="11" text-anchor="end" fill="var(--tx)">${esc(t.nm.length > 22 ? t.nm.slice(0, 21) + "…" : t.nm)}</text><rect x="${X(a)}" y="${y}" width="${Math.max(2, X(b) - X(a))}" height="16" rx="3" fill="var(--bd)"/><rect x="${X(a)}" y="${y}" width="${Math.max(0, (X(b) - X(a)) * Math.min(p, 100) / 100)}" height="16" rx="3" fill="var(--ac)"/>`;
    }).join("");
    const today = tn >= d0 && tn <= d1 ? `<line x1="${X(tn)}" x2="${X(tn)}" y1="0" y2="${ts.length * rh + 4}" stroke="var(--bad)" stroke-dasharray="4 3" stroke-width="1.5"/>` : "";
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Jadwal pekerjaan">${bars}${today}<text x="${L}" y="${h - 6}" font-size="10" fill="var(--mu)">${esc(new Date(d0 * 86400000).toISOString().slice(0, 10))}</text><text x="${w - 10}" y="${h - 6}" font-size="10" text-anchor="end" fill="var(--mu)">${esc(new Date(d1 * 86400000).toISOString().slice(0, 10))}</text></svg>`;
}

function jadUI() {
    const ts = S.tasks || [], ow = role == "owner";
    if (!ts.length) { $("#t-j").innerHTML = cardH("Jadwal Pekerjaan", '<div class="al wa">Jadwal belum disiapkan. Owner mengisinya di Pengaturan, bagian Jadwal pekerjaan.</div>'); return; }
    const cc = c => c == "ok" ? "disetujui" : c == "wa" ? "revisi" : c == "bad" ? "ditolak" : "mu";
    const rows = ts.map(t => { const x = taskStatus(t); return `<tr><td><b>${esc(t.nm)}</b><div class="sub">${esc(t.mulai)} sampai ${esc(t.selesai)}</div></td><td>${Math.round(x.plan)}%</td><td>${x.aktual}%</td><td><span class="chip ${cc(x.cls)}">${esc(x.s)}</span>${x.p && x.p.cat ? `<div class="sub">${esc(x.p.cat)}</div>` : ""}</td></tr>`; }).join("");
    const upd = ts.map(t => `<tr data-tid="${t.id}"><td>${esc(t.nm)}</td><td><input class="tp-pct" type="number" min="0" max="100" step="1" value="${(lastProg(t.id) || {}).pct ?? ""}" style="width:70px"></td><td><input class="tp-sel" type="date" style="width:140px"></td><td><input class="tp-cat" maxlength="80" placeholder="catatan" style="width:170px"></td><td><button class="btn g" data-tp="${t.id}" style="padding:4px 10px">Perbarui</button></td></tr>`).join("");
    $("#t-j").innerHTML = cardH("Jadwal Pekerjaan", `<div class="sc">${ganttSVG()}</div><div class="leg">Abu-abu: rencana. Oranye: realisasi. Garis merah putus-putus: hari ini.</div><div class="tw" style="margin-top:8px"><table><tr><th>Pekerjaan</th><th>Rencana hari ini</th><th>Realisasi</th><th>Status</th></tr>${rows}</table></div>`)
      + cardH("Perbarui realisasi", `<div class="sub" style="margin-bottom:6px">Isi persen selesai terbaru. Tanggal selesai wajib diisi jika 100%. Menurunkan persen wajib disertai catatan.</div><div class="row">${ow ? "" : nameField("tp0")}</div><div class="tw"><table><tr><th>Pekerjaan</th><th>Selesai (%)</th><th>Tgl selesai</th><th>Catatan</th><th></th></tr>${upd}</table></div><div class="er-msg" id="tpm"></div>`);
}
$("#t-j").addEventListener("click", async e => {
    const b = e.target.closest("[data-tp]");
    if (!b) return;
    const row = b.closest("tr"), tid = +b.dataset.tp, m = $("#tpm"), ow = role == "owner";
    const pct = +row.querySelector(".tp-pct").value, sel = row.querySelector(".tp-sel").value, cat = row.querySelector(".tp-cat").value.trim(), by = ow ? "Owner" : $("#tp0").value.trim(), prev = lastProg(tid);
    if (row.querySelector(".tp-pct").value === "" || !(pct >= 0 && pct <= 100)) { m.textContent = "Isi persen selesai antara 0 dan 100."; return; }
    if (!by) { m.textContent = "Isi nama pencatat."; return; }
    if (prev && pct < prev.pct && cat.length < 5) { m.textContent = "Menurunkan persen dari " + prev.pct + "% wajib disertai catatan (minimal 5 huruf)."; return; }
    if (pct == 100 && !sel) { m.textContent = "Isi tanggal selesai karena pekerjaan 100%."; return; }
    if (sel) { const de = dateError(sel, null); if (de) { m.textContent = de.replace("kerja", "selesai"); return; } }
    if (!ow) WHO = by;
    try { await apiAddProg({ tid, pct, aSelesai: sel || "", cat, by }); jadUI(); if (ow) render(); }
    catch (x) { m.textContent = "Gagal menyimpan: " + ((x && x.message) || x); }
});

const rabRow = it => `<tr class="rr"><td><select class="r-kat" style="max-width:150px">${KATB.map(k => `<option${k == it.kat ? " selected" : ""}>${k}</option>`).join("")}</select></td><td><input class="r-ur" value="${esc(it.uraian || "")}" style="width:150px"></td><td><input class="r-vol" type="number" step="any" min="0" value="${it.vol ?? ""}" style="width:64px"></td><td><input class="r-sat" value="${esc(it.sat || "")}" style="width:50px"></td><td><input class="r-hr" type="number" step="any" min="0" value="${it.harga ?? ""}" style="width:96px"></td><td><input class="r-pct" type="number" step="any" min="0" max="100" value="${it.pct ?? ""}" style="width:56px"></td><td><button class="btn g" data-rmrow="1" style="padding:3px 9px">×</button></td></tr>`;
function rabEdHTML() {
    const f = rabSummary();
    return `<div class="card" id="sec-rab"><h2>RAB dan biaya proyek</h2>
      <div class="sub" style="margin-bottom:8px">Isi nilai kontrak dan semua komponen biaya yang dibutuhkan selama proyek: material, upah, peralatan, subkontraktor, pajak, perizinan dan biaya dinas, pengawas, konsultan, overhead, dan lain-lain. Setiap baris dihitung volume × harga, atau persen dari nilai kontrak (cocok untuk pajak). Tarif pajak dan biaya lain mengikuti ketentuan dan kontrak yang berlaku; angka di sini hanya yang Anda isi.</div>
      <div class="row"><label>Nilai kontrak / pendapatan (Rp)<input id="rabn" type="number" min="0" step="any" value="${(S.fcfg || {}).nilai || ""}" style="width:200px"></label></div>
      <div class="tw"><table><tr><th>Kategori</th><th>Uraian</th><th>Vol.</th><th>Sat.</th><th>Harga satuan</th><th>% kontrak</th><th></th></tr><tbody id="rabb">${((S.fcfg || {}).rab || []).map(rabRow).join("") || rabRow({})}</tbody></table></div>
      <div class="row" style="margin-top:6px"><button class="btn g" id="rabadd">+ Tambah baris</button><button class="btn g" id="rabpj">+ Baris pajak (% kontrak)</button><button class="btn" id="rabsv">Simpan RAB</button></div>
      <div class="sub">Total RAB saat ini: <b>${Rp(f.total)}</b></div><div class="er-msg" id="rabm"></div></div>`;
}
async function saveRab() {
    const m = $("#rabm"), nilai = +$("#rabn").value || 0;
    const rows = [...document.querySelectorAll("#rabb .rr")].map(r => ({ kat: r.querySelector(".r-kat").value, uraian: r.querySelector(".r-ur").value.trim(), vol: +r.querySelector(".r-vol").value || 0, sat: r.querySelector(".r-sat").value.trim(), harga: +r.querySelector(".r-hr").value || 0, pct: +r.querySelector(".r-pct").value || 0 })).filter(x => x.uraian || x.vol || x.harga || x.pct);
    if (nilai < 0 || nilai > 1e13) { m.textContent = "Nilai kontrak tidak valid."; return; }
    for (const x of rows) {
        if (!x.uraian) { m.textContent = "Setiap baris perlu uraian."; return; }
        if (x.pct < 0 || x.pct > 100) { m.textContent = 'Persen "' + x.uraian + '" harus 0 sampai 100.'; return; }
        if (x.pct > 0 && !nilai) { m.textContent = 'Baris "' + x.uraian + '" memakai persen kontrak; isi nilai kontrak dulu.'; return; }
        if (x.pct == 0 && !(x.vol > 0 && x.harga >= 0)) { m.textContent = 'Isi volume dan harga untuk "' + x.uraian + '", atau isi persen dari nilai kontrak.'; return; }
    }
    S.fcfg = { nilai, rab: rows };
    const tot = rabSummary().total;
    logAdd("RAB diperbarui: " + rows.length + " item, total " + Rp(tot));
    try { await apiSaveFcfg(); save(); m.textContent = "RAB tersimpan: " + rows.length + " item, total " + Rp(tot) + "."; render(); }
    catch (x) { m.textContent = "Gagal menyimpan: " + ((x && x.message) || x); }
}

const mmRow = it => `<tr class="mr" data-id="${esc(it.id || "")}"><td><input class="m-nm" value="${esc(it.nm || "")}" style="width:170px"></td><td><input class="m-sat" value="${esc(it.sat || "")}" style="width:56px"></td><td><input class="m-min" type="number" min="0" step="any" value="${it.min ?? ""}" style="width:70px"></td><td><input class="m-keb" type="number" min="0" step="any" value="${it.keb ?? ""}" style="width:80px"></td><td><input class="m-hr" type="number" min="0" step="any" value="${it.harga ?? ""}" style="width:96px"></td><td><button class="btn g" data-rmrow="1" style="padding:3px 9px">×</button></td></tr>`;
function matmEdHTML() {
    return `<div class="card" id="sec-matm"><h2>Daftar material</h2><div class="sub" style="margin-bottom:8px">Material yang dipakai proyek. Supervisor mencatat keluar masuknya. Kebutuhan (sesuai RAB) dan harga standar dipakai untuk peringatan dan penilaian biaya.</div>
      <div class="tw"><table><tr><th>Material</th><th>Sat.</th><th>Stok min.</th><th>Kebutuhan RAB</th><th>Harga standar</th><th></th></tr><tbody id="mmb">${(S.matm || []).map(mmRow).join("") || mmRow({})}</tbody></table></div>
      <div class="row" style="margin-top:6px"><button class="btn g" id="mmadd">+ Tambah material</button><button class="btn" id="mmsv">Simpan daftar material</button></div><div class="er-msg" id="mmm"></div></div>`;
}
async function saveMatm2() {
    const m = $("#mmm"), old = S.matm || [];
    const rows = [...document.querySelectorAll("#mmb .mr")].map((r, i) => ({ id: r.dataset.id || "m" + Date.now().toString(36) + i, nm: r.querySelector(".m-nm").value.trim(), sat: r.querySelector(".m-sat").value.trim(), min: +r.querySelector(".m-min").value || 0, keb: +r.querySelector(".m-keb").value || 0, harga: +r.querySelector(".m-hr").value || 0 })).filter(x => x.nm || x.sat);
    for (const x of rows) if (!x.nm || !x.sat) { m.textContent = "Setiap material perlu nama dan satuan."; return; }
    const gone = old.filter(o => !rows.some(r => r.id == o.id) && (S.mat || []).some(e => e.mid == o.id));
    if (gone.length) { m.textContent = 'Material "' + gone[0].nm + '" sudah punya catatan keluar masuk dan tidak dapat dihapus.'; return; }
    S.matm = rows;
    logAdd("daftar material diperbarui: " + rows.length + " item");
    try { await apiSaveMatm(); save(); m.textContent = "Daftar material tersimpan (" + rows.length + " item)."; matUI(); }
    catch (x) { m.textContent = "Gagal menyimpan: " + ((x && x.message) || x); }
}

const tkRow = it => `<tr class="tr2" data-id="${esc(it.id || "")}"><td><input class="t-nm" value="${esc(it.nm || "")}" style="width:200px"></td><td><input class="t-a" type="date" value="${esc(it.mulai || "")}"></td><td><input class="t-b" type="date" value="${esc(it.selesai || "")}"></td><td><button class="btn g" data-rmrow="1" style="padding:3px 9px">×</button></td></tr>`;
function taskEdHTML() {
    return `<div class="card" id="sec-task"><h2>Jadwal pekerjaan</h2><div class="sub" style="margin-bottom:8px">Daftar pekerjaan dengan tanggal mulai dan target selesai. Supervisor memperbarui persen selesai; aplikasi menghitung status keterlambatan.</div>
      <div class="tw"><table><tr><th>Pekerjaan</th><th>Mulai</th><th>Target selesai</th><th></th></tr><tbody id="tkb">${(S.tasks || []).map(tkRow).join("") || tkRow({})}</tbody></table></div>
      <div class="row" style="margin-top:6px"><button class="btn g" id="tkadd">+ Tambah pekerjaan</button><button class="btn" id="tksv">Simpan jadwal</button></div><div class="er-msg" id="tkm"></div></div>`;
}
async function saveTasks2() {
    const m = $("#tkm"), old = S.tasks || [];
    let next = Math.max(0, ...old.map(t => t.id)) + 1;
    const rows = [...document.querySelectorAll("#tkb .tr2")].map(r => ({ id: r.dataset.id ? +r.dataset.id : next++, nm: r.querySelector(".t-nm").value.trim(), mulai: r.querySelector(".t-a").value, selesai: r.querySelector(".t-b").value })).filter(x => x.nm || x.mulai || x.selesai);
    for (const x of rows) {
        if (!x.nm || !x.mulai || !x.selesai) { m.textContent = "Setiap pekerjaan perlu nama, tanggal mulai, dan target selesai."; return; }
        if (x.selesai < x.mulai) { m.textContent = 'Target selesai "' + x.nm + '" tidak boleh sebelum tanggal mulai.'; return; }
    }
    const gone = old.filter(o => !rows.some(r => r.id == o.id) && (S.tprog || []).some(p => p.tid == o.id));
    if (gone.length) { m.textContent = 'Pekerjaan "' + gone[0].nm + '" sudah punya catatan progres dan tidak dapat dihapus.'; return; }
    S.tasks = rows;
    logAdd("jadwal pekerjaan diperbarui: " + rows.length + " pekerjaan");
    try { await apiSaveTasks(); save(); m.textContent = "Jadwal tersimpan (" + rows.length + " pekerjaan)."; jadUI(); }
    catch (x) { m.textContent = "Gagal menyimpan: " + ((x && x.message) || x); }
}
$("#cf").addEventListener("click", async e => {
    const t = e.target;
    if (t.id == "rabadd") $("#rabb").insertAdjacentHTML("beforeend", rabRow({}));
    if (t.id == "rabpj") $("#rabb").insertAdjacentHTML("beforeend", rabRow({ kat: "Pajak (PPN, PPh)", uraian: "Pajak (persen dari nilai kontrak)" }));
    if (t.dataset.rmrow) { const tr = t.closest("tr"), body = tr.parentNode; if (body.children.length > 1) tr.remove(); }
    if (t.id == "rabsv") await saveRab();
    if (t.id == "mmadd") $("#mmb").insertAdjacentHTML("beforeend", mmRow({}));
    if (t.id == "mmsv") await saveMatm2();
    if (t.id == "tkadd") $("#tkb").insertAdjacentHTML("beforeend", tkRow({}));
    if (t.id == "tksv") await saveTasks2();
});

let ANA = { a: 1, b: 9999 };

function miniChart(title, labels, series, zero) {
    if (!labels.length) return `<h2>${title}</h2><div class="sub">Tidak ada data pada rentang ini.</div>`;
    const w = 640, h = 190, L = 46, T = 14, B = 24, R = 12, pw = w - L - R, ph = h - T - B;
    const all = series.flatMap(s => s.v), lo0 = Math.min(...all), hi0 = Math.max(...all), span = (hi0 - lo0) || 1;
    const lo = zero ? Math.min(0, lo0) : lo0 - span * 0.1, hi = hi0 + span * 0.1;
    const X = i => L + (labels.length < 2 ? pw / 2 : i / (labels.length - 1) * pw), Y = v => T + (1 - (v - lo) / (hi - lo)) * ph;
    let g = "";
    for (let k = 0; k <= 4; k++) {
        const v = lo + (hi - lo) * k / 4;
        g += `<line x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--bd)"/><text x="${L - 5}" y="${Y(v) + 4}" font-size="10" text-anchor="end" fill="var(--mu)">${Math.abs(v) >= 1000 ? Math.round(v / 1000) + "rb" : Math.round(v * 10) / 10}</text>`;
    }
    labels.forEach((lb, i) => { if (labels.length <= 12 || i % Math.ceil(labels.length / 12) == 0) g += `<text x="${X(i)}" y="${h - 8}" font-size="10" text-anchor="middle" fill="var(--mu)">${lb}</text>`; });
    const lines = series.map(s => `<polyline points="${s.v.map((v, i) => X(i) + "," + Y(v)).join(" ")}" fill="none" stroke="${s.c}" stroke-width="2.5"/>` + s.v.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="${s.c}"/>`).join("")).join("");
    return `<h2>${title}</h2><div class="sc"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">${g}${lines}</svg></div><div class="leg">Sumbu X: hari kerja.</div>`;
}

const KAMUS = [
    ["rekap harian", "hari, tanggal (kerja), pengisi, status laporan, jumlah pekerja bekerja/sakit/APD tidak lengkap/APD sebagian/absen, jam lembur dibayar, rata-rata KPI, upah total (Rp), progres kumulatif sistem (%)"],
    ["per pekerja", "hari, tanggal, pekerja, zona, status, volume dan satuan, target, rasio volume (%), KPI, upah pokok, lembur, bonus, potongan, upah total (Rp)"],
    ["opname", "nomor opname, setelah hari ke, tanggal, progres (%), pemeriksa, serta per item: pekerjaan, lokasi, satuan, volume rencana, volume terpasang, bobot (%), capaian (%)"],
    ["biaya", "per kategori: RAB, realisasi, selisih; nilai kontrak, estimasi dan proyeksi keuntungan; lalu catatan biaya: tanggal, kategori, keterangan, jumlah, pencatat, terverifikasi"],
    ["material", "keluar masuk: tanggal, material, satuan, jenis, jumlah, harga satuan, nilai, keterangan, pencatat; ringkasan stok: masuk, keluar, stok, batas minimum, kebutuhan RAB, status"],
    ["jadwal", "pekerjaan, mulai dan selesai rencana, rencana (%) hari ini, realisasi (%), status, catatan terakhir"]
];

function barChart(title, items, ref) {
    if (!items.length) return `<h2>${title}</h2><div class="sub">Tidak ada data pada rentang ini.</div>`;
    const w = 640, rh = 26, h = items.length * rh + 24, L = 120, pw = w - L - 50, mx = Math.max(120, ...items.map(i => i.v)), X = v => L + v / mx * pw;
    const bars = items.map((it, i) => `<text x="${L - 6}" y="${i * rh + 17}" font-size="11" text-anchor="end" fill="var(--tx)">${esc(it.l)}</text><rect x="${L}" y="${i * rh + 5}" width="${Math.max(1, X(it.v) - L)}" height="16" rx="3" fill="${it.v >= ref ? "var(--ok)" : "var(--ac)"}"/><text x="${X(it.v) + 5}" y="${i * rh + 17}" font-size="11" fill="var(--mu)">${Math.round(it.v)}%</text>`).join("");
    return `<h2>${title}</h2><div class="sc"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">${bars}<line x1="${X(ref)}" x2="${X(ref)}" y1="0" y2="${h - 16}" stroke="var(--bad)" stroke-dasharray="4 3"/><text x="${X(ref)}" y="${h - 3}" font-size="10" text-anchor="middle" fill="var(--bad)">target ${ref}%</text></svg></div>`;
}

function anaUI() {
    const m = M(), n = m.n;
    if (!n) { $("#t-n").innerHTML = cardH("Analisis Data", '<div class="sub">Belum ada data untuk dianalisis.</div>'); return; }
    const a = Math.min(Math.max(1, ANA.a), n), b = Math.min(Math.max(a, ANA.b), n), s = seriesRange(m, a, b), r = s.ringkas, ka = kpiAnalysis(m, a, b);
    const opt = sel => Array.from({ length: n }, (_, i) => `<option value="${i + 1}"${i + 1 == sel ? " selected" : ""}>Hari ${i + 1}</option>`).join("");
    const cor = v => v === null ? "belum dapat dihitung (data kurang)" : (Math.abs(v) < 0.3 ? "lemah" : Math.abs(v) < 0.6 ? "sedang" : "kuat") + " (r = " + F(v, 2) + ")";
    const per = ka.per.map(p => `<tr><td>${esc(p.nm)}</td><td>${p.hari}</td><td>${F(p.rasio * 100, 0)}%</td><td>${F(p.kpi)}</td><td>${p.apd}</td><td>${p.sakit}</td><td>${p.absen}</td></tr>`).join("");
    $("#t-n").innerHTML = cardH("Analisis Data", `<div class="row"><label>Dari<select id="aa">${opt(a)}</select></label><label>Sampai<select id="ab">${opt(b)}</select></label></div>
      <div class="grid">${kp(r.hari, "Hari dianalisis")}${kp(Rp(r.upah), "Total upah")}${kp(F(r.lembur), "Jam lembur dibayar")}${kp(F(r.kpi), "Rata-rata KPI")}${kp(r.apd, "Kasus APD bermasalah")}${kp(r.sakit + " / " + r.absen, "Sakit / absen (orang-hari)")}</div>`)
      + cardH("", miniChart("Progres kumulatif sistem (%)", s.labels, [{ v: s.prog, c: "var(--ac)" }]))
      + cardH("", miniChart("Upah per hari (Rp)", s.labels, [{ v: s.upah, c: "var(--ok)" }], true))
      + cardH("", miniChart("Rata-rata KPI dan kehadiran bekerja (%)", s.labels, [{ v: s.kpi, c: "var(--ac)" }, { v: s.hadir, c: "var(--mu)" }], true) + '<div class="leg">Oranye: rata-rata KPI. Abu-abu: persentase pekerja yang bekerja.</div>')
      + cardH("", barChart("Realisasi dibanding target volume per pekerja (rata-rata rasio)", ka.per.filter(p => p.hari).map(p => ({ l: p.nm, v: p.rasio * 100 })), 100))
      + cardH("Rekap produktivitas dan keselamatan per pekerja", `<div class="tw"><table><tr><th>Pekerja</th><th>Hari bekerja</th><th>Rata rasio volume</th><th>Rata KPI</th><th>Kasus APD</th><th>Sakit</th><th>Absen</th></tr>${per}</table></div>
        <div class="sub" style="margin-top:6px">Hubungan produktivitas dengan kedisiplinan K3: ${cor(ka.rK3)}. Hubungan produktivitas dengan ketelitian: ${cor(ka.rTeliti)}. Dihitung dari ${ka.n} data pekerja-hari. Korelasi bukan bukti sebab-akibat dan tidak andal bila datanya sedikit.</div>`)
      + cardH("Laporan dan ekspor", `<div class="row"><label>Jenis laporan<select id="rp1"><option value="harian">Harian</option><option value="mingguan">Mingguan</option><option value="bulanan">Bulanan</option><option value="akhir">Rekap akhir proyek</option></select></label><label>Periode<select id="rp2"></select></label></div>
        <div class="row"><button class="btn" id="rppdf">Unduh PDF</button><button class="btn g" id="rpcsv">Unduh Excel (CSV)</button><button class="btn g" id="rptxt">Unduh teks (.txt)</button></div>
        <label style="display:flex;gap:6px;align-items:center;font-size:13px;margin:6px 0"><input type="checkbox" id="anon" style="width:auto"> Anonimkan nama pekerja dan pengisi (untuk data penelitian)</label>
        <div class="sub">PDF, CSV (dibuka di Excel atau Google Sheets), dan teks laporan diunduh sebagai berkas.</div>
        <div class="row" style="margin-top:8px"><button class="btn g" data-ex="rekap">Rekap harian</button><button class="btn g" data-ex="pekerja">Per pekerja</button><button class="btn g" data-ex="opname">Opname</button><button class="btn g" data-ex="biaya">Biaya (RAB)</button><button class="btn g" data-ex="material">Material</button><button class="btn g" data-ex="jadwal">Jadwal</button></div>`)
      + cardH("Kamus data", `<div class="tw"><table><tr><th>Berkas</th><th>Kolom dan artinya</th></tr>${KAMUS.map(k => `<tr><td>${k[0]}</td><td>${esc(k[1])}</td></tr>`).join("")}</table></div><div class="sub">Rumus KPI, upah, dan progres dijelaskan di tab Bantuan. Klaim bahwa aplikasi meningkatkan produktivitas perlu diuji dengan metode dan data yang sesuai; fitur saja bukan bukti.</div>`);
    fillRp();
}

function fillRp() {
    const m = M(), t = $("#rp1").value, n = m.n;
    let o = "";
    if (t == "harian") o = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">Hari ke-${i + 1}</option>`).join("");
    else if (t == "mingguan") o = Array.from({ length: Math.ceil(n / 7) }, (_, i) => `<option value="${i + 1}">Minggu ke-${i + 1}</option>`).join("");
    else if (t == "bulanan") o = [...new Set(S.meta.map(x => (x.tgl || "").slice(0, 7)).filter(Boolean))].map(x => `<option value="${x}">${x}</option>`).join("") || '<option value="">(belum ada tanggal)</option>';
    else o = '<option value="">Seluruh proyek</option>';
    $("#rp2").innerHTML = o;
}
const rpSel = () => { const t = $("#rp1").value, v = $("#rp2").value; return [t, t == "bulanan" ? v : t == "akhir" ? null : +v]; };

$("#t-n").addEventListener("change", e => {
    if (e.target.id == "aa") { ANA.a = +e.target.value; anaUI(); }
    if (e.target.id == "ab") { ANA.b = +e.target.value; anaUI(); }
    if (e.target.id == "rp1") fillRp();
});

function exportCsv(name, data) {
    download(name, data, name.endsWith(".txt") ? "text/plain" : "text/csv");
    toast("Berkas " + name + " diunduh.");
}

$("#t-n").addEventListener("click", async e => {
    const m = M(), anon = $("#anon") && $("#anon").checked, a = Math.min(Math.max(1, ANA.a), m.n), b = Math.min(Math.max(a, ANA.b), m.n);
    const bt = e.target.closest("[data-ex]");
    if (bt) {
        const k = bt.dataset.ex;
        await exportCsv("siteowner-" + k + ".csv", k == "rekap" ? csvRekap(m, a, b, anon) : k == "pekerja" ? csvPekerja(m, a, b, anon) : k == "opname" ? csvOpname() : k == "biaya" ? csvBiaya(m) : k == "material" ? csvMaterial() : csvJadwal());
    }
    if (e.target.id == "rppdf" || e.target.id == "rpcsv" || e.target.id == "rptxt") {
        const [type, arg] = rpSel(), [ra, rb] = periodRange(type, m, arg), lines = reportLines(m, type, arg), nm = "laporan-" + type + (arg ? "-" + arg : "");
        if (e.target.id == "rpcsv") await exportCsv(nm + ".csv", csvRekap(m, ra, rb, anon));
        else if (e.target.id == "rptxt") exportCsv(nm + ".txt", lines.join("\n"));
        else { download(nm + ".pdf", makePdf(lines[0], lines), "application/pdf"); toast("Laporan PDF diunduh."); }
    }
});

function logUI() {
    const ev = activity().slice(0, 80);
    $("#t-r").innerHTML = cardH("Riwayat Aktivitas", `<div class="sub" style="margin-bottom:8px">Catatan siapa melakukan apa dan kapan: laporan, koreksi, keputusan persetujuan, opname, penyegelan, biaya, dan perubahan pengaturan.</div>${ev.length ? `<div class="tw"><table><tr><th>Waktu</th><th>Pelaku</th><th>Kegiatan</th></tr>${ev.map(x => `<tr><td>${esc(new Date(x.ts).toLocaleString("id-ID"))}</td><td>${esc(x.who || "-")}</td><td>${esc(x.txt)}</td></tr>`).join("")}</table></div>` : '<div class="sub">Belum ada aktivitas.</div>'}`);
}

function kpiHTML(m) {
    if (!m.n) return "";
    const rows = m.last.o.map((o, i) => o.st == 1
        ? `<tr><td>${esc(W[i][0])}</td><td>${F(S.days[m.n - 1][i].v, 1)} / ${W[i][3]}</td><td>${Math.round(o.ra * 100)}%</td><td>${o.ks}</td><td>${o.kt}</td><td>${o.kd}</td><td><b>${F(o.kpi)}</b></td></tr>`
        : `<tr><td>${esc(W[i][0])}</td><td colspan="6" class="sub">${esc(o.ket || ST[o.st])}</td></tr>`).join("");
    return `<div class="card"><h2>Transparansi KPI hari ke-${m.n}</h2><div class="tw"><table><tr><th>Pekerja</th><th>Volume / target</th><th>Rasio</th><th>Nilai cepat</th><th>Nilai teliti</th><th>Nilai K3</th><th>KPI</th></tr>${rows}</table></div><div class="sub">KPI = (cepat + teliti + K3) ÷ 15 × 100, dibulatkan 1 desimal. Nilai cepat: rasio 110% atau lebih = 5, 95% = 4, 80% = 3, 60% = 2, di bawahnya 1. KPI hanya salah satu dasar; keputusan upah atau sanksi perlu pemeriksaan manusia dan aturan tertulis yang disepakati.</div></div>`;
}

function tindakanHTML(m) {
    const t = todo(m);
    return `<div class="card"><h2>Perlu tindakan${t.length ? " (" + t.length + ")" : ""}</h2>${t.length ? t.map(x => `<div class="al ${x[0]}">${esc(x[1])}${TABN[x[2]] ? ` <button class="btn g" data-go="${x[2]}" style="padding:3px 10px;margin-left:6px">Buka ${TABN[x[2]]}</button>` : ""}</div>`).join("") : '<div class="al ok">Tidak ada tindakan mendesak.</div>'}</div>`;
}

function quickHTML() {
    const b = (g, t) => `<button class="btn g" data-go="${g}" style="margin:3px">${t}</button>`;
    return `<div class="card"><h2>Pengaturan cepat</h2><div class="sub" style="margin-bottom:6px">Pintasan ke pengaturan yang paling sering diubah. Seluruh pengaturan ada di tab Pengaturan.</div>${b("p:#sec-pekerja", "Pekerja dan target")}${b("p:#sec-upah", "Aturan upah")}${b("p:#sec-plan", "Rencana progres")}${b("k", "Keuangan")}${b("p:#sec-rab", "RAB dan biaya")}${b("p:#sec-matm", "Daftar material")}${b("p:#sec-task", "Jadwal pekerjaan")}${b("p:#sec-aman", "Keamanan (PIN)")}${b("p:#sec-cad", "Cadangan data")}${b("p", "Semua pengaturan")}</div>`;
}

function go(spec) {
    const [tab, sel] = spec.split(":");
    document.querySelector('.tabs button[data-t="' + tab + '"]').click();
    if (sel) setTimeout(() => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
}
$("#t-d").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });

function cadHTML() {
    return `<div class="card" id="sec-cad"><h2>Cadangan data</h2><div class="sub" style="margin-bottom:8px">Buat cadangan secara berkala lalu uji bahwa cadangan dapat dibaca dan utuh. Cadangan yang belum pernah diuji belum tentu dapat dipulihkan.</div>
      <div class="row"><button class="btn g" id="cb1">Unduh cadangan</button></div>
      <label style="display:block;font-size:12px;color:var(--mu)">Isi cadangan (JSON) untuk diuji atau dipulihkan<textarea id="cbt" style="width:100%;height:110px"></textarea></label>
      <div class="row" style="margin-top:6px"><button class="btn g" id="cb2">Uji cadangan</button><button class="btn g" id="cb3">Pulihkan ke perangkat ini</button></div><div class="sub" id="cbm"></div></div>`;
}

function backupData() {
    return {
        versi: 3, dibuat: nowIso(),
        proyek: { nama: S.nama, dur: S.dur, awal: S.awal, W: S.W, cfg: S.cfg, shape: S.shape, plan: S.plan, planHist: S.planHist, anggaran: S.anggaran },
        hari: S.raw.map((rows, i) => ({ n: i + 1, rows, by: (S.meta[i] || {}).by, ts: (S.meta[i] || {}).iso, tgl: (S.meta[i] || {}).tgl })),
        koreksi: S.corr, persetujuan: S.apprLog, opname: S.op, segel: S.seals,
        keuangan: S.finLog, fcfg: S.fcfg, matm: S.matm, mat: S.mat, tasks: S.tasks, tprog: S.tprog
    };
}

let armed = 0;
$("#cf").addEventListener("click", async e => {
    const m = $("#cbm");
    if (e.target.id == "cb1") { const j = JSON.stringify(backupData(), null, 1); $("#cbt").value = j; download("siteowner-cadangan-" + todayStr() + ".json", j, "application/json"); m.textContent = "Cadangan diunduh (dan ditampilkan di kotak di atas). Simpan di tempat aman."; }
    if (e.target.id == "cb2") {
        const r = await checkBackup($("#cbt").value);
        m.textContent = r.ok ? "Cadangan valid: " + r.hari + " hari, " + r.opname + " opname, " + r.koreksi + " koreksi, " + r.biaya + " biaya." : "Cadangan tidak valid: " + r.err;
    }
    if (e.target.id == "cb3") {
        const r = await checkBackup($("#cbt").value);
        if (!r.ok) { m.textContent = "Tidak dipulihkan: " + r.err; return; }
        if (Date.now() - armed > 8000) { armed = Date.now(); m.textContent = "Data di perangkat ini akan DIGANTI. Tekan Pulihkan sekali lagi dalam 8 detik untuk melanjutkan."; return; }
        const j = JSON.parse($("#cbt").value), p = j.proyek;
        Object.assign(S, { nama: p.nama, dur: p.dur, awal: p.awal, W: p.W, cfg: p.cfg || {}, shape: p.shape || "linear", plan: p.plan || [], planHist: p.planHist || [], anggaran: p.anggaran || 0 });
        S.raw = j.hari.map(d => d.rows);
        S.meta = j.hari.map(d => ({ ts: d.ts ? new Date(d.ts).toLocaleString("id-ID") : "", iso: d.ts, by: d.by, tgl: d.tgl, photos: d.photos || [] }));
        S.corr = j.koreksi || []; S.apprLog = j.persetujuan || []; S.op = j.opname || []; S.seals = j.segel || []; S.finLog = j.keuangan || []; S.fcfg = j.fcfg || { nilai: 0, rab: [] }; S.matm = j.matm || []; S.mat = j.mat || []; S.tasks = j.tasks || []; S.tprog = j.tprog || [];
        lc(); normState(); save(); armed = 0;
        m.textContent = "Dipulihkan: " + r.hari + " hari.";
        render(); refresh();
    }
});

$("#lo").onclick = () => gate();
$("#ft").addEventListener("input", () => { dirty = true; clearErr(); prev(); });
form();
render();
gate();
