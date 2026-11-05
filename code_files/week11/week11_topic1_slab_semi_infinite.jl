# Week 11 - Topic 1: Unsteady 1D Diffusion - Semi-Infinite Medium and Finite Slab
# Lecture (Part 1):
#   * Fick's second law (1D, no reaction, no bulk motion): dc/dt = D d2c/dz2
#   * semi-infinite medium, c(z,0) = c0, c(0,t) = cs, c(inf,t) = c0  (Laplace transform):
#       (c - c0)/(cs - c0) = erfc( z / (2 sqrt(D t)) )
#       surface flux  N(0,t) = (cs - c0) sqrt(D/(pi t))       (decays as t^-1/2)
#       uptake per area  W/S = 2 (cs - c0) sqrt(D t / pi)       (grows as t^1/2)
#   * finite slab 0 < z < L, c = cs on both faces, Y = (c - cs)/(c0 - cs):
#       Y = (4/pi) sum_k 1/(2k-1) sin((2k-1) pi z/L) exp(-(2k-1)^2 pi^2 D t / L^2)
#       fractional uptake  M(t)/M_inf = 1 - sum_k 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo),  Fo = D t/L^2
#   * case study (lecture): P diffusion into Si, cs = 2.5e20 cm^-3, target 2.5e18 cm^-3,
#     D = 6.5e-13 cm^2/s at 1373 K, t = 1 h  ->  erfc(phi) = 0.01, phi = 1.82, z = 1.76 um
# Run: julia week11_topic1_slab_semi_infinite.jl   (no packages needed; erfc is coded below)

using Printf

# complementary error function: erfc(x) = exp(-x^2) * continued-fraction / series (accurate to ~1e-15)
function erfc_(x::Float64)
    if x < 0
        return 2.0 - erfc_(-x)
    elseif x < 2.0
        # series for erf
        s, term, n = x, x, 0
        while abs(term) > 1e-17 * abs(s)
            n += 1
            term *= -x^2 / n
            s += term / (2n + 1)
        end
        return 1.0 - 2.0 / sqrt(pi) * s
    else
        # Lentz continued fraction
        f = x; C = x; Dd = 0.0
        for n in 1:300
            an = n / 2
            Dd = x + an * Dd; Dd = 1 / Dd
            C = x + an / C
            delta = C * Dd
            f *= delta
            abs(delta - 1) < 1e-16 && break
        end
        return exp(-x^2) / (f * sqrt(pi))
    end
end

function erfc_inv(y)
    lo, hi = 0.0, 10.0
    for _ in 1:200
        mid = 0.5 * (lo + hi)
        erfc_(mid) > y ? (lo = mid) : (hi = mid)
    end
    return 0.5 * (lo + hi)
end

slab_series(z, t, D, L, nterms=200) =
    sum(4 / ((2k - 1) * pi) * sin((2k - 1) * pi * z / L) * exp(-((2k - 1) * pi / L)^2 * D * t) for k in 1:nterms)

slab_uptake(Fo, nterms=200) = 1 - sum(8 / ((2k - 1)^2 * pi^2) * exp(-((2k - 1) * pi)^2 * Fo) for k in 1:nterms)

function thomas(a, b, c, d)
    n = length(d)
    cp = zeros(n); dp = zeros(n); x = zeros(n)
    cp[1] = c[1] / b[1]; dp[1] = d[1] / b[1]
    for i in 2:n
        m = b[i] - a[i] * cp[i-1]
        cp[i] = i < n ? c[i] / m : 0.0
        dp[i] = (d[i] - a[i] * dp[i-1]) / m
    end
    x[n] = dp[n]
    for i in n-1:-1:1
        x[i] = dp[i] - cp[i] * x[i+1]
    end
    return x
end

function slab_cn(FoEnd; N=100, steps=2000)
    h = 1 / N; dt = FoEnd / steps; r = dt / h^2
    Y = ones(N + 1); Y[1] = 0.0; Y[end] = 0.0
    n = N - 1
    a = fill(-r / 2, n); b = fill(1 + r, n); c = fill(-r / 2, n)
    for _ in 1:steps
        d = [r / 2 * Y[i-1] + (1 - r) * Y[i] + r / 2 * Y[i+1] for i in 2:N]
        Y[2:N] = thomas(a, b, c, d)
    end
    return Y
end

println("=== 1. Semi-infinite medium: profile, flux, uptake ===")
D, dc = 1.0e-9, 1.0
for t in (10.0, 100.0, 1000.0)
    @printf("t = %7.0f s: sqrt(Dt) = %7.1f um, N(0) = %.3e mol/m2/s, uptake = %.3e mol/m2\n",
            t, sqrt(D * t) * 1e6, dc * sqrt(D / (pi * t)), 2 * dc * sqrt(D * t / pi))
end
@printf("  N(0) x sqrt(t) = dc sqrt(D/pi) = %.4e for every t\n", dc * sqrt(D / pi))

println("\n=== 2. Case: P doping of Si (lecture) ===")
cs, ct, Dp, tt = 2.5e20, 2.5e18, 6.5e-13, 3600.0
phi = erfc_inv(ct / cs)
@printf("erfc(phi) = %.3f  ->  phi = %.3f\n", ct / cs, phi)
@printf("depth for 2.5e18 cm^-3 after 1 h at 1373 K: z = %.2f um   (lecture: 1.76 um)\n", 2 * phi * sqrt(Dp * tt) * 1e4)
for hrs in (0.25, 1.0, 4.0)
    @printf("  t = %4.2f h -> z = %.2f um  (depth ~ sqrt(t))\n", hrs, 2 * phi * sqrt(Dp * hrs * 3600) * 1e4)
end

println("\n=== 3. Finite slab: Fourier series vs Crank-Nicolson ===")
for Fo in (0.01, 0.05, 0.2)
    Y = slab_cn(Fo)
    err = maximum(abs(Y[i+1] - slab_series(i / 100, Fo, 1, 1)) for i in 0:100)
    @printf("Fo = %4.2f: Y(centre) series = %.5f, CN = %.5f, max |diff| = %.1e\n", Fo, slab_series(0.5, Fo, 1, 1), Y[51], err)
end
println("terms needed at t = 0+ (Gibbs): the series converges slowly near the faces;")
for nt in (1, 5, 50)
    @printf("  %3d terms: Y(z/L = 0.02, Fo = 0) = %.3f (exact 1)\n", nt, slab_series(0.02, 0.0, 1, 1, nt))
end

println("\n=== 4. When is a slab 'semi-infinite'? ===")
println("  Fo      exact M/Minf   short-time 4 sqrt(Fo/pi)   error")
for Fo in (0.001, 0.01, 0.03, 0.05, 0.1, 0.2)
    ex = slab_uptake(Fo); st = 4 * sqrt(Fo / pi)
    @printf("  %5.3f   %.4f         %.4f                  %6.2f%%\n", Fo, ex, st, 100 * (st - ex) / ex)
end
println("-> the two faces do not 'see' each other until Fo ~ 0.05 (error about 0.1%)")
