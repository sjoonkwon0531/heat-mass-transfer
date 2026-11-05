# Week 11 - Topic 4: Spherical Coordinates - Reaction in a Catalyst Pellet and Legendre Polynomials
# Lecture (Part 3):
#   * radial problem (w = r^2, p = r^2): (1/r^2)(r^2 F')' = -lambda^2 F -> F = sin(lambda r)/r (spherical Bessel j0)
#       Type 1 F(1) = 0: lambda_n = n pi;  Type 2 F'(1) = 0: lambda = tan(lambda);
#       Type 3 F'(1) + A F(1) = 0: lambda = (1 - A) tan(lambda)
#   * Ex 1, steady first-order reaction in a sphere, Da = k R^2/D (= phi^2, Thiele modulus squared):
#       Theta = sinh(sqrt(Da) r)/(r sinh(sqrt(Da))),  effectiveness eta = 3 (phi coth phi - 1)/phi^2
#   * Ex 2, transient start-up, Theta(r,0) = 0:
#       Theta = steady + 2 sum_n (n pi)(-1)^n/((n pi)^2 + Da) exp(-((n pi)^2 + Da) t) sin(n pi r)/r
#   * polar problem (eta = cos(theta)): Legendre polynomials, int P_n P_m = 2/(2n+1) delta_nm
#   * Ex 3, sphere (k_B) in a matrix (k_A) under a uniform gradient, gamma = k_B/k_A:
#       inside gradient = 3/(2 + gamma);  Maxwell: k_eff/k_A = (gamma + 2 + 2f(gamma - 1))/(gamma + 2 - f(gamma - 1))
# Run: julia week11_topic4_sphere_reaction_legendre.jl

using Printf

function steady_profile(r, Da)
    p = sqrt(Da)
    return r < 1e-12 ? p / sinh(p) : sinh(p * r) / (r * sinh(p))
end

effectiveness(phi) = 3 * (phi / tanh(phi) - 1) / phi^2

function transient(r, t, Da; nterms=400)
    s = steady_profile(r, Da)
    for n in 1:nterms
        a = n * pi
        shape = r < 1e-12 ? a : sin(a * r) / r
        s += 2 * a * (isodd(n) ? -1.0 : 1.0) / (a^2 + Da) * exp(-(a^2 + Da) * t) * shape
    end
    return s
end

function fv_transient(tEnd, Da; N=60)
    dr = 1 / N
    steps = floor(Int, tEnd / (0.15 * dr^2)) + 1
    dt = tEnd / steps
    vol = [((i + 1)^3 - i^3) * dr^3 / 3 for i in 0:N-1]
    th = zeros(N); nw = zeros(N)
    for _ in 1:steps
        for i in 1:N
            aw, ae = ((i - 1) * dr)^2, (i * dr)^2
            fw = i > 1 ? aw * (th[i] - th[i-1]) / dr : 0.0
            fe = i < N ? ae * (th[i+1] - th[i]) / dr : ae * (1.0 - th[i]) / (dr / 2)
            nw[i] = th[i] + dt * ((fe - fw) / vol[i] - Da * th[i])
        end
        th .= nw
    end
    return th
end

function legendre(n, x)
    n == 0 && return 1.0
    p0, p1 = 1.0, x
    for k in 1:n-1
        p0, p1 = p1, ((2k + 1) * x * p1 - k * p0) / (k + 1)
    end
    return p1
end

function simpson_pm1(f; m=40)
    n = 2m; h = 2.0 / n
    s = f(-1.0) + f(1.0)
    for i in 1:n-1
        s += (isodd(i) ? 4 : 2) * f(-1.0 + i * h)
    end
    return s * h / 3
end

maxwell(g, f) = (g + 2 + 2f * (g - 1)) / (g + 2 - f * (g - 1))

function bisect(f, a, b)
    for _ in 1:100
        c = 0.5 * (a + b)
        f(a) * f(c) <= 0 ? (b = c) : (a = c)
    end
    return 0.5 * (a + b)
end

println("=== 1. Steady reaction in a sphere: profile and effectiveness factor ===")
for Da in (0.25, 1.0, 9.0, 100.0)
    phi = sqrt(Da)
    @printf("  Da = %6.2f (phi = %5.2f): centre Theta = %.4f, eta = %.4f, large-phi limit 3/phi = %.4f\n",
            Da, phi, steady_profile(0, Da), effectiveness(phi), 3 / phi)
end

println("\n=== 2. Transient start-up (Ex 2): series vs finite volume, Da = 9 ===")
Da = 9.0
for t in (0.02, 0.1, 0.5)
    th = fv_transient(t, Da)
    @printf("  t = %4.2f: centre series = %.5f, FV = %.5f  (steady %.5f)\n", t, transient(0, t, Da), th[1], steady_profile(0, Da))
end
@printf("  check t = 0: Theta(0.5, 0) = %.4f (should be 0)\n", transient(0.5, 0.0, Da; nterms=4000))
@printf("  slowest decay rate pi^2 + Da = %.3f: reaction speeds up the approach to steady state\n", pi^2 + Da)

println("\n=== 3. Radial eigenvalues of a sphere ===")
@printf("  Type 1: n pi = [%.4f, %.4f, %.4f]\n", pi, 2pi, 3pi)
t2 = [bisect(x -> sin(x) - x * cos(x), (k + 0.5) * pi - 0.5, (k + 0.5) * pi - 1e-9) for k in 1:3]
@printf("  Type 2 (lambda = tan lambda): [%.4f, %.4f, %.4f]\n", t2[1], t2[2], t2[3])

println("\n=== 4. Legendre polynomials: orthogonality ===")
for n in 0:3
    print("  ")
    for m in 0:3
        @printf(" %+.4f", simpson_pm1(x -> legendre(n, x) * legendre(m, x)))
    end
    @printf("    2/(2n+1) = %.4f\n", 2 / (2n + 1))
end

println("\n=== 5. Sphere in a gradient: Maxwell effective conductivity ===")
println("  gamma = kB/kA   inside gradient 3/(2+gamma)   k_eff/k_A at f = 0.1, 0.3")
for g in (0.0, 0.1, 1.0, 10.0, 100.0)
    @printf("  %7.1f          %.4f                  %.4f, %.4f\n", g, 3 / (2 + g), maxwell(g, 0.1), maxwell(g, 0.3))
end
println("  case: thermal interface material, epoxy kA = 0.2 W/m/K with alumina kB = 30 W/m/K")
for f in (0.1, 0.3, 0.5)
    @printf("    f = %.1f: k_eff = %.3f W/m/K\n", f, 0.2 * maxwell(150.0, f))
end
println("  -> even very conductive fillers raise k_eff by at most (1 + 2f)/(1 - f) in the dilute model")
