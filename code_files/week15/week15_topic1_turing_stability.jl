# Week 15 · Topic 1 — Linear stability and the Turing instability
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   2x2 system: lambda^2 - T lambda + Delta = 0
#   reaction-diffusion: W_t = D lap W + J W  ->  lambda(k) = eig(J - k^2 D)
#   Example: Lengyel-Epstein (CDIMA) model
#     u_t = a - u - 4uv/(1+u^2) + lap u
#     v_t = sigma [ b (u - uv/(1+u^2)) + d lap v ]
using Printf

function eig2(a11, a12, a21, a22)
    T = a11 + a22; De = a11 * a22 - a12 * a21; disc = T^2 - 4De
    if disc >= 0
        r = sqrt(disc); return ((T + r) / 2, 0.0, (T - r) / 2, 0.0)
    end
    r = sqrt(-disc); return (T / 2, r / 2, T / 2, -r / 2)
end

function classify(a11, a12, a21, a22)
    T = a11 + a22; De = a11 * a22 - a12 * a21
    De < 0 && return "saddle"
    if T^2 - 4De < 0
        T < 0 && return "stable spiral"
        return T > 0 ? "unstable spiral" : "center"
    end
    return T < 0 ? "stable node" : "unstable node"
end

lam_max(fu, fv, gu, gv, d, k) = eig2(fu - k^2, fv, gu, gv - d * k^2)[1]

function main()
    println("Topic 1 — linear stability and the Turing instability\n")
    println("[1] Classification of 2x2 linear systems (trace T, determinant Delta)")
    cases = [(-1.0, 0.0, 0.0, -2.0), (1.0, 0.0, 0.0, 2.0), (1.0, 0.0, 0.0, -1.0), (-0.5, -2.0, 2.0, -0.5), (0.5, -2.0, 2.0, 0.5), (0.0, -1.0, 1.0, 0.0)]
    for c in cases
        T = c[1] + c[4]; De = c[1] * c[4] - c[2] * c[3]; e = eig2(c...)
        @printf("   A = [[%5.2f %5.2f] [%5.2f %5.2f]]  T = %5.2f  Delta = %5.2f  lambda = %.3f%+.3fi, %.3f%+.3fi  -> %s\n",
                c[1], c[2], c[3], c[4], T, De, e[1], e[2], e[3], e[4], classify(c...))
    end
    println()
    a, b, sigma, dd = 12.0, 0.3, 50.0, 1.0
    u = a / 5; v = 1 + u^2; q = 1 + u^2
    fu = (3u^2 - 5) / q; fv = -4u / q; gu = sigma * 2b * u^2 / q; gv = -sigma * b * u / q
    d = sigma * dd
    @printf("[2] Lengyel-Epstein model: a = %.0f, b = %.1f, sigma = %.0f, d = %.1f\n", a, b, sigma, dd)
    @printf("   steady state u* = %.4f, v* = %.4f\n", u, v)
    @printf("   J = [[%.4f %.4f] [%.4f %.4f]]\n", fu, fv, gu, gv)
    T = fu + gv; De = fu * gv - fv * gu
    @printf("   without diffusion: T = %.4f (< 0), Delta = %.4f (> 0) -> %s\n", T, De, classify(fu, fv, gu, gv))
    c1 = d * fu + gv; c2 = c1^2 / (4d)
    @printf("   condition 1: d_eff*R11 + R22 = %.4f (> 0 needed)\n", c1)
    @printf("   condition 2: Delta = %.4f < (d_eff*R11 + R22)^2/(4 d_eff) = %.4f\n", De, c2)
    kc2 = c1 / (2d)
    @printf("   k* (minimum of det) = %.4f, L_c = 2 pi/k* = %.4f\n", sqrt(kc2), 2pi / sqrt(kc2))
    best_k, best_l = 0.0, -1e9
    lo, hi = -1.0, -1.0
    for i in 0:30000
        k = 3.0 * i / 30000; l = lam_max(fu, fv, gu, gv, d, k)
        if l > best_l; best_k, best_l = k, l; end
        if l > 0; lo < 0 && (lo = k); hi = k; end
    end
    @printf("   fastest-growing mode (max Re lambda): k_m = %.4f, lambda_m = %.4f, wavelength 2 pi/k_m = %.4f\n", best_k, best_l, 2pi / best_k)
    @printf("   unstable band: %.4f < k < %.4f\n", lo, hi)
    @printf("   (min-det k* equals the fastest mode only at onset; here they differ by %.1f%%)\n", 100 * (sqrt(kc2) / best_k - 1))
    println()
    println("[3] Critical diffusivity ratio: smallest d_eff giving a Turing band")
    lo_d, hi_d = 1.0, 200.0
    for _ in 1:80
        m = 0.5 * (lo_d + hi_d); c1m = m * fu + gv
        if c1m > 0 && De < c1m^2 / (4m); hi_d = m; else; lo_d = m; end
    end
    @printf("   d_c = %.4f (sigma*d must exceed this)\n", hi_d)
end

main()
