% Week 4 - Topic 2: Transient Conduction in a Slab - Separation of Variables
% Y = (T-Ts)/(T0-Ts) = (4/pi) * sum_{n odd} (1/n) sin(n*pi*x/L) exp(-(n*pi/2)^2*Fo)
% Fo = alpha*t/(L/2)^2. First term alone = Heisler-chart regime (Fo >= ~0.2).

function week4_topic2_separation_slab
    close all; clc
    % --- Centerline: full series vs 1-term ---
    fprintf('Centerline history Y_c, x/L = 0.5\n');
    fprintf('  Fo     full series   1-term    rel. error\n');
    for Fo = [0.02 0.05 0.1 0.2 0.5 1.0]
        full = slabseries(0.5, Fo, 399);
        one  = 4/pi * sin(pi*0.5) * exp(-(pi/2)^2 * Fo);
        fprintf('  %4.2f   %10.6f  %8.6f   %6.3f %%\n', ...
                Fo, full, one, abs(one-full)/full*100);
    end
    fprintf('  -> beyond Fo ~ 0.2 one term is enough.\n');

    % --- Space-time field, imagesc like the lecture demos ---
    xv = linspace(0, 1, 101);
    Fov = linspace(1e-4, 1.0, 200);
    Y = zeros(numel(Fov), numel(xv));
    for i = 1:numel(Fov)
        for j = 1:numel(xv)
            Y(i,j) = slabseries(xv(j), Fov(i), 199);
        end
    end
    figure(1);
    imagesc(xv, Fov, Y); colorbar; colormap('hot'); axis xy
    xlabel('x/L'); ylabel('Fo'); title('Y(x, Fo) - transient slab, Dirichlet faces');

    figure(2); hold on
    for Fo = [0.05 0.1 0.2 0.5]
        plot(xv, arrayfun(@(x) slabseries(x, Fo, 399), xv), 'LineWidth', 1.5);
    end
    grid on; xlabel('x/L'); ylabel('Y');
    legend('Fo=0.05','Fo=0.1','Fo=0.2','Fo=0.5'); title('Profiles: sine modes decay fast');

    % --- Worked example: 20 mm steel plate, T0 = 600 -> Ts = 30 degC ---
    L = 0.020; alpha = 45/(7800*480); T0 = 600; Ts = 30; half = L/2;
    fprintf('\nWorked example: 20 mm steel plate, T0 = 600 -> Ts = 30 degC\n');
    for t = [0.5 1 2 5 10]
        Fo = alpha*t/half^2;
        Tc = Ts + (T0 - Ts)*slabseries(0.5, Fo, 399);
        fprintf('  t = %5.1f s  Fo = %6.3f  T_center = %7.2f degC\n', t, Fo, Tc);
    end
end

function Y = slabseries(xoL, Fo, nmax)
    Y = 0;
    for n = 1:2:nmax
        Y = Y + sin(n*pi*xoL)/n * exp(-(n*pi/2)^2 * Fo);
    end
    Y = 4/pi * Y;
end
