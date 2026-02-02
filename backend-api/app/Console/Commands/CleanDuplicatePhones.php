<?php

namespace App\Console\Commands;

use App\Models\Membre;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanDuplicatePhones extends Command
{
    protected $signature = 'membres:clean-duplicates';
    protected $description = 'Nettoyer les numéros de téléphone en doublon';

    public function handle()
    {
        $this->info('Début du nettoyage des doublons...');
        
        $duplicates = DB::table('membres')
            ->select(DB::raw('REPLACE(REPLACE(REPLACE(telephone, " ", ""), "+", ""), "-", "") as clean_phone, COUNT(*) as count'))
            ->groupBy('clean_phone')
            ->having('count', '>', 1)
            ->get();
        
        $this->info(count($duplicates) . ' doublons trouvés.');
        
        foreach ($duplicates as $duplicate) {
            $this->line("Traitement: {$duplicate->clean_phone} ({$duplicate->count} occurences)");
            
            $membres = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') = ?", [$duplicate->clean_phone])
                ->orderBy('created_at', 'asc')
                ->get();
            
            $firstMembre = $membres->first();
            
            // Formater le numéro du premier
            $normalized = $this->normalizePhone($firstMembre->telephone);
            $formatted = $this->formatPhone($normalized);
            $firstMembre->update(['telephone' => $formatted]);
            
            // Marquer les autres
            for ($i = 1; $i < count($membres); $i++) {
                $newPhone = $membres[$i]->telephone . '_DUPLICATE_' . time();
                $membres[$i]->update(['telephone' => $newPhone]);
                $this->warn("  → ID {$membres[$i]->id} marqué comme doublon");
            }
        }
        
        $this->info('Nettoyage terminé!');
        Log::info('Nettoyage des doublons exécuté via commande Artisan');
        
        return Command::SUCCESS;
    }
    
    private function normalizePhone($phone)
    {
        $cleaned = preg_replace('/\D/', '', $phone);
        
        if (strlen($cleaned) >= 12 && str_starts_with($cleaned, '243')) {
            return '0' . substr($cleaned, -9);
        }
        
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
            return $cleaned;
        }
        
        if (strlen($cleaned) === 9) {
            return '0' . $cleaned;
        }
        
        return $cleaned;
    }
    
    private function formatPhone($phone)
    {
        $cleaned = preg_replace('/\D/', '', $phone);
        
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
            return '0' . substr($cleaned, 1, 2) . ' ' . 
                    substr($cleaned, 3, 3) . ' ' . 
                    substr($cleaned, 6, 4);
        }
        
        return $phone;
    }
}