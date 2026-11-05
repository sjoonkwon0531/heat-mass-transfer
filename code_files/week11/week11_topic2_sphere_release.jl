# Week 11 - Topic 2: Transient Diffusion in a Sphere - Drug Release from a Gel Bead
# Lecture (Part 1):
#   dc/dt = D (d2c/dr2 + (2/r) dc/dr),  c(R,t) = cs = 0 (perfect sink),  dc/dr(0,t) = 0,  c(r,0) = c0
#   (c - c0)/(cs - c0) = 1 + (2R/(pi r)) sum_n (-1)^n/n sin(n pi r/R) exp(-n^2 pi^2 D t/R^2)
#   centre (r -> 0, sin x/x -> 1):  (c(0,t) - c0)/(cs - c0) = 1 + 2 sum_n (-1)^n exp(-n^2 pi^2 tau)
#   release rate   W(t) = 8 pi c0 D R sum_n exp(-n^2 pi^2 tau)
#   remaining      m(t)/m0 = (6/pi^2) sum_n (1/n^2) exp(-n^2 pi^2 tau),   tau = D t / R^2
#   long times (one term): m/m0 ~ (6/pi^2) exp(-pi^2 tau)  (the lecture writes ~ exp(-pi^2 tau))
#   short times: released fraction ~ 6 sqrt(tau/pi) - 3 tau  (semi-infinite limit with curvature)
# Run: julia week11_topic2_sphere_release.jl

using Printf

remaining(tau; nterms=400) = tau <= 0 ? 1.0 : 6 / pi^2 * sum(exp(-(n * pi)^2 * tau) / n^2 for n in 1:nterms)

function theta(rho, tau; nterms=400)
    tau <= 0 && return 1.0
    s = 0.0
    for n in 1:nterms
        e = exp(-(n * pi)^2 * tau)
        e < 1e-300 && break
        shape = rho < 1e-12 ? n * pi : sin(n * pi * rho) / rho
        s += 2.0 * (isodd(n) ? 1.0 : -1.0) / (n * pi) * shape * e
    end
    return s
end

function tau_for(target)
    lo, hi = 1e-8, 5.0
    for _ in 1:200
        mid = sqrt(lo * hi)
        remaining(mid) > target ? (lo = mid) : (hi = mid)
    end
    return sqrt(lo * hi)
end

function finite_volume(tauEnd; N=200, steps=40000)
    dr = 1 / N; dt = tauEnd / steps
    vol = [((i + 1)^3 - i^3) * dr^3 / 3 for i in 0:N-1]
    area = [(i + 1)^2 * dr^2 for i in 0:N-1]
    c = ones(N); flux = zeros(N); nw = zeros(N)
    for _ in 1:steps
        for i in 1:N-1
            flux[i] = -area[i] * (c[i+1] - c[i]) / dr
        end
        flux[N] = -area[N] * (0.0 - c[N]) / (0.5 * dr)
        for i in 1:N
            inflow = (i > 1 ? flux[i-1] : 0.0) - flux[i]
            nw[i] = c[i] + dt * inflow / vol[i]
        end
        c .= nw
    end
    return c[1], 3 * sum(c .* vol)
end

println("=== 1. Series solution: centre concentration and remaining drug ===")
println("  tau      c(0)/c0    m/m0 (series)   one-term (6/pi^2)e^(-pi^2 tau)")
for tau in (0.01, 0.03, 0.05, 0.1, 0.2, 0.3)
    @printf("  %5.2f    %.5f    %.5f        %.5f\n", tau, theta(0.0, tau), remaining(tau), 6 / pi^2 * exp(-pi^2 * tau))
end

println("\n=== 2. Check against a finite-volume solution (200 shells) ===")
for tau in (0.03, 0.1)
    cc, m = finite_volume(tau)
    @printf("  tau = %4.2f: centre FV = %.4f vs series %.4f; m/m0 FV = %.4f vs series %.4f\n",
            tau, cc, theta(0.5 / 200, tau), m, remaining(tau))
end

println("\n=== 3. Characteristic release times ===")
t50, t90 = tau_for(0.5), tau_for(0.1)
@printf("  50%% released at tau = %.4f;  90%% released at tau = %.4f\n", t50, t90)
@printf("  short-time check: 6 sqrt(tau/pi) - 3 tau at tau_50 = %.4f (should be 0.5)\n", 6 * sqrt(t50 / pi) - 3 * t50)

println("\n=== 4. Case: release from hydrogel beads (illustrative diffusivities) ===")
for (name, D) in (("small drug, D = 5e-10 m^2/s", 5e-10), ("protein, D = 1e-11 m^2/s", 1e-11))
    println("  ", name)
    for Rmm in (0.1, 0.5, 1.0, 2.0)
        R = Rmm * 1e-3
        @printf("    R = %3.1f mm: t50 = %8.2f min, t90 = %8.1f min\n", Rmm, t50 * R^2 / D / 60, t90 * R^2 / D / 60)
    end
end
println("  -> release time scales as R^2/D: halving the bead radius releases four times faster")
