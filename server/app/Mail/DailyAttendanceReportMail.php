<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyAttendanceReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public $companyName;
    public $reportDate;
    public $reportData; // Array of employee attendance and task data
    public $totalPresent;
    public $totalAbsent;

    /**
     * Create a new message instance.
     */
    public function __construct($companyName, $reportDate, array $reportData, $totalPresent, $totalAbsent)
    {
        $this->companyName = $companyName;
        $this->reportDate = $reportDate;
        $this->reportData = $reportData;
        $this->totalPresent = $totalPresent;
        $this->totalAbsent = $totalAbsent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Daily Attendance Report for {$this->reportDate} - {$this->companyName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.daily_attendance_report', // Blade view for the email content
            with: [
                'companyName' => $this->companyName,
                'reportDate' => $this->reportDate,
                'reportData' => $this->reportData,
                'totalPresent' => $this->totalPresent,
                'totalAbsent' => $this->totalAbsent,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
