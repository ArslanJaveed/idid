<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $companyName;
    public $employeeIdCode;
    public $inviteLink;

    /**
     * Create a new message instance.
     */
    public function __construct($employeeName, $companyName, $employeeIdCode, $inviteLink)
    {
        $this->employeeName = $employeeName;
        $this->companyName = $companyName;
        $this->employeeIdCode = $employeeIdCode;
        $this->inviteLink = $inviteLink;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You\'re Invited to Join ' . $this->companyName . ' on Our Employee Management System!',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.employee_invite', // Blade view for the email content
            with: [
                'employeeName' => $this->employeeName,
                'companyName' => $this->companyName,
                'employeeIdCode' => $this->employeeIdCode,
                'inviteLink' => $this->inviteLink,
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
