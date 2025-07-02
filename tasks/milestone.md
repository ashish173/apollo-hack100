## Milestone 1: Send Email

    1. `pdf parsing` using some library and regex -> {candidate email, interviewer email}
    2. create and save document in "Interview" collection {interview_id:"123", candidate_email: "xyz", interviewer_email:"abc", status: "email_to_candidate"}
    3. `emailService` -> send email to candidate, takes parameter{to:"", from:"", subject:"" , content:""}

## Milestone 2: listen email

    1. `email_listner`
        1.1 read permission of HR emailbox: in every 5min. check for new email. (eg: cron)
        1.2 when found one, saves 'email message id' as {message_id:""} and 'email response' to `Conversation` collection
            {conversation_id:"", interview_id"", message_id:"", to:"", from:"", content:"", subject:"", processState:"false"} 

## Milestone 3: Process AI

    1. `Intelligent_service`
        1.1 parameter- {conversation_id:"", message_id:""}
        1.2 processes the "Conversation" document based on current process state.
        1.3 finds a meeting slot from conversation and suggest next step.
        1.4 save response to "AiRequest" collection - {interview_id:"", nextStep:"email to candidate" | "email to interviewer" | "human intervention needed" | "confirmation of event"}
        1.5 update the "conversation" collection {processState:"true"}

## Milestone 4: Act on Intelligent service response

    1. `Scheduler` checks for response of "Intelligent_service"
        1.1 case response: {nextStep:"email to candidate"} : `email service`
        1.1 case response: {nextStep:"email to interviewer"} : `email service`
        1.1 case response: {nextStep:"human intervention needed"} : shows to recruiter
        1.1 case response: {nextStep:"confirmation of event"} : `Schedule_event`

## Milestone 5: Schedule Event

    1. `Schedule_event`
        1.1 adds a calender event.
        1.2 adds conf. link and email addresses of both party
        1.3 saves the event.
        1.4 update the "Interview" collection {status:"Scheduled", meeting:{link:"", time:""}}

    
## Database collection:

1 **Interview**

```ts
type Interview = {
  interview_id: string;
  candidateEmail: string;
  interviewerEmail: string;
  resume: url; //stored in storage
  created_by: string; //recruiter email
  meeting?: {
    link: string;
    time: string;
    calendar_event_id?: string;
    platform: string;
}
  status: 'awaiting_candidate' | 'awaiting_interviewer' | 'Scheduled' | 'completed';
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
};
```

2 **Conversation**

```ts
type Conversation = {
    conversation_id: string;
    interview_id: string;
    message_id: string; 
    to: string;
    from: string; 
    content: any;
    subject: string;
    processState: boolean
}
```

2 **AIRequest**

```ts
type AiRequest = {
    conversation_id: string;
    interview_id: string;
    message_id: string;
    nextStep: "email to candidate" | "email to interviewer" | "human intervention needed" | "confirmation of event";
    output?: any;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
}
```