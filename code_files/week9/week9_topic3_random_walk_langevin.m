% Week 9 - Topic 3: Random Walk, Langevin Dynamics and the Diffusivity
% Langevin (one component, m = kB T = 1): dv = -gamma v dt + sqrt(2 kappa dt) N(0,1), kappa = gamma
%   <x^2> = (2/gamma)[t - (1 - exp(-gamma t))/gamma] -> 2 D t,  D = kB T/(m gamma) = 1/gamma
%   Green-Kubo: D = int <v(t) v(0)> dt = int exp(-gamma t) dt = 1/gamma
% Porous lattice walk: blind ant on a periodic square lattice with open-site fraction eps.
rng(7);
gamma = 2.0; dt = 0.01; nwalk = 4000; nsteps = 2000; amp = sqrt(2*gamma*dt);
v = randn(nwalk, 1); v0 = v; x = zeros(nwalk, 1);
ts = (200:200:nsteps)*dt; msd = zeros(size(ts)); vacf = msd; k2 = 0;
for k = 1:nsteps
    v = v - gamma*v*dt + amp*randn(nwalk, 1);    % vectorized over walkers
    x = x + v*dt;
    if mod(k, 200) == 0
        k2 = k2 + 1; msd(k2) = mean(x.^2); vacf(k2) = mean(v.*v0);
    end
end
exact = 2/gamma*(ts - (1 - exp(-gamma*ts))/gamma);
fprintf('   t     MSD_sim   MSD_exact   VACF_sim  VACF_exact\n');
fprintf('%6.2f  %9.4f  %9.4f   %8.4f  %8.4f\n', [ts; msd; exact; vacf; exp(-gamma*ts)]);
fprintf('Long-time D = %.3f (theory %.3f)\n', (msd(end) - msd(5))/(ts(end) - ts(5))/2, 1/gamma);
figure; plot(ts, msd, 'o', ts, exact, '-', 'LineWidth', 2);
xlabel('t'); ylabel('<x^2>'); legend('simulation', 'exact Langevin', 'Location', 'northwest');
set(gca, 'FontName', 'Arial Narrow', 'FontSize', 14);

% porous lattice walk
L = 64; nw = 500; ns = 3000; di = [1 -1 0 0]; dj = [0 0 1 -1];
fprintf('\n  porosity   D_eff/D_0   eps^2\n');
for eps_ = [1.0 0.9 0.8 0.7 0.6 0.5]
    rng(1); open_ = rand(L) < eps_; voids = find(open_);
    s2 = 0;
    for w = 1:nw
        [i, j] = ind2sub([L L], voids(randi(numel(voids)))); X = 0; Y = 0;
        dirs = randi(4, ns, 1);
        for n = 1:ns
            d = dirs(n); ni = mod(i - 1 + di(d), L) + 1; nj = mod(j - 1 + dj(d), L) + 1;
            if open_(ni, nj), i = ni; j = nj; X = X + di(d); Y = Y + dj(d); end
        end
        s2 = s2 + X^2 + Y^2;
    end
    fprintf('   %4.2f      %7.3f    %5.3f\n', eps_, s2/nw/ns, eps_^2);
end
